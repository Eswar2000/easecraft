import { describe, expect, it } from "vitest";

import {
  componentCategories,
  componentSlugs,
  getInstallCommand,
  getInstallPlan,
  listComponents,
} from "easecraft-registry";

describe("component explorer registry consumption", () => {
  it("provides the categories and nine cards rendered by the explorer", () => {
    expect(["All", ...componentCategories]).toEqual([
      "All",
      "Text",
      "Layout",
      "Overlay",
      "Feedback",
    ]);
    expect(listComponents().map((component) => component.slug)).toEqual(componentSlugs);
    expect(componentSlugs).toHaveLength(9);
  });

  it("provides the implemented docs route for every explorer card", () => {
    expect(
      listComponents().map((component) => ({
        href: component.docsPath,
        name: component.name,
        status: component.status,
      })),
    ).toEqual([
      { href: "/components/text-reveal", name: "Text Reveal", status: "implemented" },
      { href: "/components/number-ticker", name: "Number Ticker", status: "implemented" },
      {
        href: "/components/staggered-list",
        name: "Staggered List",
        status: "implemented",
      },
      { href: "/components/animated-tabs", name: "Animated Tabs", status: "implemented" },
      { href: "/components/motion-dialog", name: "Motion Dialog", status: "implemented" },
      { href: "/components/toast-stack", name: "Toast Stack", status: "implemented" },
      { href: "/components/filter-grid", name: "Filter Grid", status: "implemented" },
      { href: "/components/scroll-reveal", name: "Scroll Reveal", status: "implemented" },
      {
        href: "/components/animated-accordion",
        name: "Animated Accordion",
        status: "implemented",
      },
    ]);
  });

  it("provides deterministic package and copy-source plans for every explorer card", () => {
    componentSlugs.forEach((slug) => {
      const packagePlan = getInstallPlan(slug, "package");
      const copySourcePlan = getInstallPlan(slug, "copy-source");

      expect(packagePlan.files).toEqual([]);
      expect(getInstallCommand(packagePlan)).toBe("pnpm add easecraft@0.0.0");
      expect(copySourcePlan.files.at(-1)?.destinationPath).toBe(`components/easecraft/${slug}.tsx`);
      expect(getInstallCommand(copySourcePlan)).toMatch(/^pnpm add /u);
    });
  });
});
