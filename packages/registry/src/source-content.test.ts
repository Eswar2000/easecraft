import { describe, expect, it } from "vitest";

import {
  componentSlugs,
  compositionSlugs,
  getCompositionInstallPlan,
  getInstallPlan,
} from "./index.js";
import { getRegistrySourceContent, registrySourcePaths } from "./source-content.js";

describe("registry source content", () => {
  it("contains every component and composition install-plan source", () => {
    const sourcePaths = new Set<string>();

    componentSlugs.forEach((slug) => {
      getInstallPlan(slug, "copy-source").files.forEach((file) => {
        sourcePaths.add(file.sourcePath);
      });
    });
    compositionSlugs.forEach((slug) => {
      for (const mode of ["package", "copy-source"] as const) {
        getCompositionInstallPlan(slug, mode).files.forEach((file) => {
          sourcePaths.add(file.sourcePath);
        });
      }
    });

    sourcePaths.forEach((sourcePath) => {
      expect(getRegistrySourceContent(sourcePath).length).toBeGreaterThan(0);
    });
    expect(registrySourcePaths).toEqual([...registrySourcePaths].sort());
    expect(registrySourcePaths).toEqual(expect.arrayContaining([...sourcePaths]));
  });

  it("rejects paths outside the static source allowlist", () => {
    expect(() => getRegistrySourceContent("../../package.json")).toThrow(
      "Unknown Easecraft source path: ../../package.json",
    );
  });
});
