import { useAtomValue } from "jotai";
import queryString from "query-string";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { resetTileset } from "./ar";
import { useAddLayer } from "./components/prototypes/layers";
import { arStartedAtom } from "./components/prototypes/view/states/ar";
import { useDatasetsByIds } from "./components/shared/graphql";
import { PlateauDataset, PlateauDatasetItem } from "./components/shared/graphql/types/catalog";
import { rootLayersAtom } from "./components/shared/states/rootLayer";
import { settingsAtom } from "./components/shared/states/setting";
import { templatesAtom } from "./components/shared/states/template";
import { createRootLayerAtom } from "./components/shared/view-layers";

function tilesetUrls(plateauDatasets: [PlateauDataset]): string[] {
  return plateauDatasets.map(plateauDataset => {
    const plateauDatasetItems = plateauDataset.items as [PlateauDatasetItem];
    // LOD2(テクスチャあり)->LOD2(テクスチャなし)->LOD1の順でフォールバック
    const tilesetUrlLod2TexItem = plateauDatasetItems.find(({ lod, texture }) => lod == 2 && texture == "TEXTURE")
    if (tilesetUrlLod2TexItem && tilesetUrlLod2TexItem.url) {
      return tilesetUrlLod2TexItem.url;
    } else {
      const tilesetUrlLod2NoneTexItem = plateauDatasetItems.find(({ lod, texture }) => lod == 2 && texture == "NONE")
      if (tilesetUrlLod2NoneTexItem && tilesetUrlLod2NoneTexItem.url) {
        return tilesetUrlLod2NoneTexItem.url;
      } else {
        const tilesetUrlLod1Item = plateauDatasetItems.find(({ lod }) => lod == 1)
        if (tilesetUrlLod1Item && tilesetUrlLod1Item.url) {
          return tilesetUrlLod1Item.url;
        } else {
          return null;
        }
      }
    }
  }).filter(x => x);
}

export default function DatasetSyncer({...props}) {
  // 開始時にクエパラでデータセットIDを指定された場合にデータセットパネルの初期化に使用するデータセット群 (レンダリング毎に忘却したいのでStateにはしない)
  let initialPlateauDatasets: [PlateauDataset];
  let initialDatasetIds: string[] = [];
  // 開始時にクエパラでデータセットIDを指定された場合にARViewの初期化に使用するtilesetURL (レンダリング毎に忘却したいのでStateにはしない)
  let initialTilesetUrls: string[] = [];
  // クエパラを見てPLATEAU ViewからのデータセットID群の初期値が来ていれば取得し、tilesetURL群に変換
  // クエパラはこんな感じで来る ?dataList=[{"datasetId":"d_13101_bldg","dataId":"di_13101_bldg_LOD1"}]
  // データセットIDのみ使用する。複数来る場合はこんな感じ ?dataList=[{"datasetId":"d_14136_bldg"},{"datasetId":"d_14135_bldg"}]
  // const searchQueryParams = queryString.parse(location.search, {arrayFormat: 'comma'});
  const searchQueryParams = queryString.parse(location.search);
  const dataList = searchQueryParams.dataList;
  try {
    if (typeof dataList === 'string') {
      const evaled: any[] = eval(dataList);
      if (evaled) {
        initialDatasetIds = evaled.map(x => x.datasetId);
      } else {
        throw "単一のパラメータが評価できません";
      }
    } else {
      throw "指定のキーを持つ単一のパラメータではありません";
    }
  } catch(e) {
    console.log("クエリパラメータが取得できません");
    console.log(e);
  }
  // フックの数を変えないためにもしクエパラがundefinedでも空配列で必ずクエリを呼び出す
  const { data } = useDatasetsByIds(initialDatasetIds);
  if (data) {
    initialPlateauDatasets = data.nodes as [PlateauDataset];
    // useDatasetsByIdsクエリが中身のあるデータを返してくるまでは待機
    if (initialPlateauDatasets) {
      const removedInitialPlateauDatasets = initialPlateauDatasets.filter(dataset => dataset.type.code !== 'bldg');
      const filteredInitialPlateauDatasets = initialPlateauDatasets.filter(dataset => dataset.type.code === 'bldg') as [PlateauDataset];

      if (removedInitialPlateauDatasets.length > 0) {
        const removedNames = removedInitialPlateauDatasets.map(item => item.name).join(', ');
        console.log(`${removedNames} はAR非対応のため非表示になります。`); // ポップアップメッセージを設定
      }
      initialTilesetUrls = tilesetUrls(filteredInitialPlateauDatasets);
    }
  }

  // データセットパネルに追加されたレイヤー群と関連フック
  const rootLayers = useAtomValue(rootLayersAtom);
  const addLayer = useAddLayer();
  const settings = useAtomValue(settingsAtom);
  const templates = useAtomValue(templatesAtom);

  // クエパラから来たデータセットID群をデータセットパネルに同期
  useEffect(() => {
    if (!initialPlateauDatasets || !initialPlateauDatasets.length) { return; }
    initialPlateauDatasets.map(dataset => {
      const datasetId = dataset.id;
      const rootLayersDatasetIds = rootLayers.map(rootLayer => rootLayer.rawDataset.id);
      if (rootLayersDatasetIds.includes(datasetId)) { return; }
      const filteredSettings = settings.filter(s => s.datasetId === datasetId);
      addLayer(
        createRootLayerAtom({
          dataset,
          settings: filteredSettings,
          templates,
          areaCode: dataset.wardCode,
        }),
        // { autoSelect: !smDown }, 
      );
    });

    return () => {

    };
  }, [initialPlateauDatasets]);

  // データセットパネルのレイヤー群が変化したらクエパラを更新して再レンダリング
  const [, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!rootLayers.length) {
      // setSearchParams({});
      return; 
    }
    const datasetIds = rootLayers.map(rootLayer => rootLayer.rawDataset.id);
    const objs = datasetIds.map(id => {
      const mapped = new Map([["datasetId", id]]);
      const obj = Object.fromEntries(mapped);
      return obj;
    });
    const datasetIdsObjsStr = JSON.stringify(objs);
    setSearchParams({dataList: datasetIdsObjsStr});

    return () => {
      // クリーンアップではクエパラをクリアしないこと
      // setSearchParams({});
    };
  }, [rootLayers]);

  // tilesetをリセット
  const arStarted = useAtomValue(arStartedAtom);
  useEffect(() => {
    if (!arStarted) { return; }
    resetTileset(initialTilesetUrls);

    return () => {
      // resetTileset([]);
    };
  }, [initialTilesetUrls]);

  return (
    <div id="dataset_syncer" {...props}></div>
  )
}