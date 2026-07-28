import { describe, expect, it } from "vitest";

import {
  componentCategories,
  componentSlugs,
  compositionSlugs,
  getCompositionInstallPlan,
  getInstallCommand,
  getInstallPlan,
  listComponents,
  listCompositions,
} from "easecraft-registry";
import { CommandPalette } from "easecraft-registry/compositions/command-palette";
import { ExpandableProjectCard } from "easecraft-registry/compositions/expandable-project-card";
import { FilterableWorkGallery } from "easecraft-registry/compositions/filterable-work-gallery";
import { NotificationCenter } from "easecraft-registry/compositions/notification-center";

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

  it("consumes completed compositions from the public registry API", () => {
    expect(compositionSlugs).toEqual([
      "command-palette",
      "expandable-project-card",
      "notification-center",
      "filterable-work-gallery",
    ]);
    expect(listCompositions()).toMatchObject([
      {
        componentDependencies: ["motion-dialog"],
        name: "Command Palette",
        status: "implemented",
      },
      {
        componentDependencies: ["animated-accordion"],
        name: "Expandable Project Card",
        status: "implemented",
      },
      {
        componentDependencies: ["toast-stack"],
        name: "Notification Center",
        status: "implemented",
      },
      {
        componentDependencies: ["filter-grid"],
        name: "Filterable Work Gallery",
        status: "implemented",
      },
    ]);

    const packagePlan = getCompositionInstallPlan("command-palette", "package");
    const copySourcePlan = getCompositionInstallPlan("command-palette", "copy-source");
    expect(getInstallCommand(packagePlan)).toBe("pnpm add easecraft@0.0.0");
    expect(copySourcePlan.files.at(-1)?.destinationPath).toBe(
      "components/easecraft/compositions/command-palette.tsx",
    );

    const projectCardPlan = getCompositionInstallPlan("expandable-project-card", "copy-source");
    expect(projectCardPlan.files.at(-1)?.destinationPath).toBe(
      "components/easecraft/compositions/expandable-project-card.tsx",
    );

    const notificationPlan = getCompositionInstallPlan("notification-center", "copy-source");
    expect(notificationPlan.files.at(-1)?.destinationPath).toBe(
      "components/easecraft/compositions/notification-center.tsx",
    );

    const galleryPlan = getCompositionInstallPlan("filterable-work-gallery", "copy-source");
    expect(galleryPlan.files.at(-1)?.destinationPath).toBe(
      "components/easecraft/compositions/filterable-work-gallery.tsx",
    );
  });

  it("provides static detail routes and public live-preview exports", () => {
    expect(compositionSlugs.map((slug) => `/compositions/${slug}`)).toEqual([
      "/compositions/command-palette",
      "/compositions/expandable-project-card",
      "/compositions/notification-center",
      "/compositions/filterable-work-gallery",
    ]);
    expect(typeof CommandPalette).toBe("function");
    expect(typeof ExpandableProjectCard).toBe("function");
    expect(typeof NotificationCenter).toBe("function");
    expect(typeof FilterableWorkGallery).toBe("function");
  });
});
