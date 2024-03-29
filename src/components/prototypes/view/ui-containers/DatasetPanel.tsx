import { styled } from "@mui/material";
import { type FC } from "react";

import { FloatingPanel } from "../../ui-components";
import { MainPanel } from "./MainPanel";

const Root = styled(FloatingPanel)(({ theme }) => ({
  width: 300,
  maxHeight: 300,
  // padding: theme.spacing(1),
}));

const Title = styled("div")(({ theme }) => ({
  ...theme.typography.h5,
  margin: theme.spacing(1),
}));

export const DatasetPanel: FC = () => {
  return (
    <Root>
      <MainPanel />
    </Root>
  );
};
