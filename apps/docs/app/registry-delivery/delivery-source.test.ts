import { describe, expect, it } from "vitest";

import { componentSlugs, getInstallPlan } from "easecraft-registry";

import { getComponentDeliverySources } from "./delivery-source";

describe("component delivery sources", () => {
  it("materializes package and copy-source modes for every component", () => {
    componentSlugs.forEach((slug) => {
      const sources = getComponentDeliverySources(slug);

      expect(sources.package).toEqual([]);
      expect(sources["copy-source"].map((file) => file.destinationPath)).toEqual(
        getInstallPlan(slug, "copy-source").files.map((file) => file.destinationPath),
      );
      expect(sources["copy-source"].every((file) => file.content.length > 0)).toBe(true);
    });
  });

  it("includes the complete transitive Filter Grid graph", () => {
    const sources = getComponentDeliverySources("filter-grid");

    expect(sources["copy-source"].map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/use-anime.ts",
      "components/easecraft/stagger.tsx",
      "components/easecraft/staggered-list.tsx",
      "components/easecraft/filter-grid.tsx",
    ]);
    expect(sources["copy-source"].at(-1)?.content).toContain("export const FilterGrid");
  });
});
