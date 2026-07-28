import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      include: ["src"],
      insertTypesEntry: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      fileName: "index",
      formats: ["es"],
    },
    minify: false,
    sourcemap: true,
    target: "es2022",
  },
});
