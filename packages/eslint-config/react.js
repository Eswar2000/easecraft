import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import baseConfig from "./base.js";

const reactFiles = ["**/*.{jsx,tsx}"];
const sourceFiles = ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"];

export default [
  ...baseConfig,
  {
    ...react.configs.flat.recommended,
    files: reactFiles,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ...react.configs.flat["jsx-runtime"],
    files: reactFiles,
  },
  {
    ...reactHooks.configs.flat["recommended-latest"],
    files: reactFiles,
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: reactFiles,
  },
  {
    files: sourceFiles,
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: reactFiles,
    rules: {
      "react/prop-types": "off",
    },
  },
];
