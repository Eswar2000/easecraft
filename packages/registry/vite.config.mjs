import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "source/compositions/*.copy.tsx"],
      include: ["src", "source/compositions/*-core.tsx", "source/compositions/*.package.tsx"],
      insertTypesEntry: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
        "compositions/animated-pricing-comparison": fileURLToPath(
          new URL("./source/compositions/animated-pricing-comparison.package.tsx", import.meta.url),
        ),
        "compositions/command-palette": fileURLToPath(
          new URL("./source/compositions/command-palette.package.tsx", import.meta.url),
        ),
        "compositions/expandable-project-card": fileURLToPath(
          new URL("./source/compositions/expandable-project-card.package.tsx", import.meta.url),
        ),
        "compositions/filterable-work-gallery": fileURLToPath(
          new URL("./source/compositions/filterable-work-gallery.package.tsx", import.meta.url),
        ),
        "compositions/mobile-navigation-panel": fileURLToPath(
          new URL("./source/compositions/mobile-navigation-panel.package.tsx", import.meta.url),
        ),
        "compositions/notification-center": fileURLToPath(
          new URL("./source/compositions/notification-center.package.tsx", import.meta.url),
        ),
        "compositions/onboarding-progress-sequence": fileURLToPath(
          new URL(
            "./source/compositions/onboarding-progress-sequence.package.tsx",
            import.meta.url,
          ),
        ),
        "compositions/scroll-driven-article-timeline": fileURLToPath(
          new URL(
            "./source/compositions/scroll-driven-article-timeline.package.tsx",
            import.meta.url,
          ),
        ),
      },
      fileName: (_format, entryName) => `${entryName}.js`,
      formats: ["es"],
    },
    minify: false,
    rollupOptions: {
      external: (id) => id === "easecraft" || id === "react" || id.startsWith("react/"),
    },
    sourcemap: true,
    target: "es2022",
  },
});
