import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: [
    // "../src/**/*.mdx", 
    // "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/app/components/**/*.mdx",
    "../src/app/components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/app/components/**/*.story.@(js|jsx|mjs|ts|tsx)",
    "../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
