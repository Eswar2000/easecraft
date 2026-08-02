import { describe, expect, it } from "vitest";

import { version as reactVersion } from "../../react/package.json";
import { version as tokensVersion } from "../../tokens/package.json";
import {
  componentSlugs,
  compositionCategories,
  compositionManifests,
  compositionRegistry,
  compositionSlugs,
  defineCompositionManifests,
  defineCompositionRegistry,
  findComposition,
  getComposition,
  getCompositionInstallPlan,
  getInstallCommand,
  isCompositionSlug,
  listCompositions,
  type CopySourceFile,
} from "./index.js";

function compositionFile(name: string, role: CopySourceFile["role"] = "composition") {
  return {
    destinationPath: `components/easecraft/compositions/${name}.tsx`,
    role,
    sourcePath: `packages/registry/source/compositions/${name}.tsx`,
  } as const;
}

describe("compositionRegistry", () => {
  it("defines the completed compositions in registry order", () => {
    expect(compositionCategories).toEqual([
      "Navigation",
      "Commerce",
      "Feedback",
      "Content",
      "Workflow",
    ]);
    expect(compositionSlugs).toEqual([
      "command-palette",
      "expandable-project-card",
      "notification-center",
      "filterable-work-gallery",
      "onboarding-progress-sequence",
      "mobile-navigation-panel",
      "animated-pricing-comparison",
      "scroll-driven-article-timeline",
    ]);
    expect(listCompositions()).toBe(compositionRegistry);
    expect(getComposition("command-palette")).toMatchObject({
      category: "Navigation",
      componentDependencies: ["motion-dialog"],
      name: "Command Palette",
      status: "implemented",
    });
    expect(findComposition("missing-composition")).toBeUndefined();
    expect(isCompositionSlug("command-palette")).toBe(true);
    expect(getComposition("expandable-project-card")).toMatchObject({
      category: "Content",
      componentDependencies: ["animated-accordion"],
      name: "Expandable Project Card",
      status: "implemented",
    });
    expect(getComposition("notification-center")).toMatchObject({
      category: "Feedback",
      componentDependencies: ["toast-stack"],
      name: "Notification Center",
      status: "implemented",
    });
    expect(getComposition("filterable-work-gallery")).toMatchObject({
      category: "Content",
      componentDependencies: ["filter-grid"],
      name: "Filterable Work Gallery",
      status: "implemented",
    });
    expect(getComposition("onboarding-progress-sequence")).toMatchObject({
      category: "Workflow",
      componentDependencies: ["animated-tabs"],
      name: "Onboarding Progress Sequence",
      status: "implemented",
    });
    expect(getComposition("mobile-navigation-panel")).toMatchObject({
      category: "Navigation",
      componentDependencies: ["motion-dialog"],
      name: "Mobile Navigation Panel",
      status: "implemented",
    });
    expect(getComposition("animated-pricing-comparison")).toMatchObject({
      category: "Commerce",
      componentDependencies: ["number-ticker"],
      name: "Animated Pricing Comparison",
      status: "implemented",
    });
    expect(getComposition("scroll-driven-article-timeline")).toMatchObject({
      category: "Content",
      componentDependencies: ["scroll-reveal"],
      name: "Scroll-driven Article Timeline",
      status: "implemented",
    });
    expect(isCompositionSlug("missing-composition")).toBe(false);
  });

  it("rejects duplicate composition slugs and unknown component dependencies", () => {
    const commandPalette = compositionRegistry[0];

    expect(() =>
      defineCompositionRegistry(componentSlugs, [commandPalette, commandPalette]),
    ).toThrow("Component registry received a duplicate composition slug: command-palette");

    const looseComponentSlugs: readonly string[] = componentSlugs;
    expect(() =>
      defineCompositionRegistry(looseComponentSlugs, [
        {
          ...commandPalette,
          componentDependencies: ["missing-component"],
          slug: "invalid-composition",
        },
      ]),
    ).toThrow(
      "Composition registry invalid-composition references an unknown component: missing-component",
    );
  });
});

describe("compositionManifests", () => {
  it("defines package and copy-source entry variants", () => {
    expect(compositionManifests["animated-pricing-comparison"]).toEqual({
      componentDependencies: ["number-ticker"],
      copySourceFiles: [
        compositionFile("animated-pricing-comparison-core", "utility"),
        {
          ...compositionFile("animated-pricing-comparison.copy"),
          destinationPath: "components/easecraft/compositions/animated-pricing-comparison.tsx",
        },
      ],
      packageFiles: [
        compositionFile("animated-pricing-comparison-core", "utility"),
        {
          ...compositionFile("animated-pricing-comparison.package"),
          destinationPath: "components/easecraft/compositions/animated-pricing-comparison.tsx",
        },
      ],
      slug: "animated-pricing-comparison",
    });
    expect(compositionManifests["command-palette"]).toEqual({
      componentDependencies: ["motion-dialog"],
      copySourceFiles: [
        compositionFile("command-palette-core", "utility"),
        {
          ...compositionFile("command-palette.copy"),
          destinationPath: "components/easecraft/compositions/command-palette.tsx",
        },
      ],
      packageFiles: [
        compositionFile("command-palette-core", "utility"),
        {
          ...compositionFile("command-palette.package"),
          destinationPath: "components/easecraft/compositions/command-palette.tsx",
        },
      ],
      slug: "command-palette",
    });
    expect(compositionManifests["expandable-project-card"]).toEqual({
      componentDependencies: ["animated-accordion"],
      copySourceFiles: [
        compositionFile("expandable-project-card-core", "utility"),
        {
          ...compositionFile("expandable-project-card.copy"),
          destinationPath: "components/easecraft/compositions/expandable-project-card.tsx",
        },
      ],
      packageFiles: [
        compositionFile("expandable-project-card-core", "utility"),
        {
          ...compositionFile("expandable-project-card.package"),
          destinationPath: "components/easecraft/compositions/expandable-project-card.tsx",
        },
      ],
      slug: "expandable-project-card",
    });
    expect(compositionManifests["notification-center"]).toEqual({
      componentDependencies: ["toast-stack"],
      copySourceFiles: [
        compositionFile("notification-center-core", "utility"),
        {
          ...compositionFile("notification-center.copy"),
          destinationPath: "components/easecraft/compositions/notification-center.tsx",
        },
      ],
      packageFiles: [
        compositionFile("notification-center-core", "utility"),
        {
          ...compositionFile("notification-center.package"),
          destinationPath: "components/easecraft/compositions/notification-center.tsx",
        },
      ],
      slug: "notification-center",
    });
    expect(compositionManifests["filterable-work-gallery"]).toEqual({
      componentDependencies: ["filter-grid"],
      copySourceFiles: [
        compositionFile("filterable-work-gallery-core", "utility"),
        {
          ...compositionFile("filterable-work-gallery.copy"),
          destinationPath: "components/easecraft/compositions/filterable-work-gallery.tsx",
        },
      ],
      packageFiles: [
        compositionFile("filterable-work-gallery-core", "utility"),
        {
          ...compositionFile("filterable-work-gallery.package"),
          destinationPath: "components/easecraft/compositions/filterable-work-gallery.tsx",
        },
      ],
      slug: "filterable-work-gallery",
    });
    expect(compositionManifests["onboarding-progress-sequence"]).toEqual({
      componentDependencies: ["animated-tabs"],
      copySourceFiles: [
        compositionFile("onboarding-progress-sequence-core", "utility"),
        {
          ...compositionFile("onboarding-progress-sequence.copy"),
          destinationPath: "components/easecraft/compositions/onboarding-progress-sequence.tsx",
        },
      ],
      packageFiles: [
        compositionFile("onboarding-progress-sequence-core", "utility"),
        {
          ...compositionFile("onboarding-progress-sequence.package"),
          destinationPath: "components/easecraft/compositions/onboarding-progress-sequence.tsx",
        },
      ],
      slug: "onboarding-progress-sequence",
    });
    expect(compositionManifests["mobile-navigation-panel"]).toEqual({
      componentDependencies: ["motion-dialog"],
      copySourceFiles: [
        compositionFile("mobile-navigation-panel-core", "utility"),
        {
          ...compositionFile("mobile-navigation-panel.copy"),
          destinationPath: "components/easecraft/compositions/mobile-navigation-panel.tsx",
        },
      ],
      packageFiles: [
        compositionFile("mobile-navigation-panel-core", "utility"),
        {
          ...compositionFile("mobile-navigation-panel.package"),
          destinationPath: "components/easecraft/compositions/mobile-navigation-panel.tsx",
        },
      ],
      slug: "mobile-navigation-panel",
    });
    expect(compositionManifests["scroll-driven-article-timeline"]).toEqual({
      componentDependencies: ["scroll-reveal"],
      copySourceFiles: [
        compositionFile("scroll-driven-article-timeline-core", "utility"),
        {
          ...compositionFile("scroll-driven-article-timeline.copy"),
          destinationPath: "components/easecraft/compositions/scroll-driven-article-timeline.tsx",
        },
      ],
      packageFiles: [
        compositionFile("scroll-driven-article-timeline-core", "utility"),
        {
          ...compositionFile("scroll-driven-article-timeline.package"),
          destinationPath: "components/easecraft/compositions/scroll-driven-article-timeline.tsx",
        },
      ],
      slug: "scroll-driven-article-timeline",
    });
  });

  it("rejects duplicate destinations and unknown component dependencies", () => {
    expect(() =>
      defineCompositionManifests(["sample"] as const, componentSlugs, {
        sample: {
          componentDependencies: ["motion-dialog"],
          copySourceFiles: [
            compositionFile("sample"),
            {
              ...compositionFile("sample-core", "utility"),
              destinationPath: "components/easecraft/compositions/sample.tsx",
            },
          ],
          packageFiles: [compositionFile("sample")],
          slug: "sample",
        },
      }),
    ).toThrow(
      "Component registry received a duplicate sample copy-source destination path: components/easecraft/compositions/sample.tsx",
    );

    const looseComponentSlugs: readonly string[] = componentSlugs;
    expect(() =>
      defineCompositionManifests(["sample"] as const, looseComponentSlugs, {
        sample: {
          componentDependencies: ["missing-component"],
          copySourceFiles: [compositionFile("sample")],
          packageFiles: [compositionFile("sample")],
          slug: "sample",
        },
      }),
    ).toThrow("Composition manifest sample references an unknown component: missing-component");
  });
});

describe("getCompositionInstallPlan", () => {
  it("creates a package-backed Command Palette plan", () => {
    const plan = getCompositionInstallPlan("command-palette", "package");

    expect(plan.componentDependencies).toEqual(["motion-dialog"]);
    expect(plan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/compositions/command-palette-core.tsx",
      "components/easecraft/compositions/command-palette.tsx",
    ]);
    expect(plan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(getInstallCommand(plan)).toBe(`pnpm add easecraft@${reactVersion}`);
  });

  it("creates a self-contained copy-source Command Palette plan", () => {
    const plan = getCompositionInstallPlan("command-palette", "copy-source");

    expect(plan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/motion-dialog.tsx",
      "components/easecraft/compositions/command-palette-core.tsx",
      "components/easecraft/compositions/command-palette.tsx",
    ]);
    expect(plan.dependencies.npm).toEqual([
      { name: "@radix-ui/react-dialog", type: "npm", version: "1.1.23" },
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
    expect(getInstallCommand(plan)).toBe(
      `pnpm add @radix-ui/react-dialog@1.1.23 animejs@4.5.0 easecraft-tokens@${tokensVersion}`,
    );
  });

  it("creates package and copy-source Expandable Project Card plans", () => {
    const packagePlan = getCompositionInstallPlan("expandable-project-card", "package");
    const copySourcePlan = getCompositionInstallPlan("expandable-project-card", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["animated-accordion"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/animated-accordion.tsx",
      "components/easecraft/compositions/expandable-project-card-core.tsx",
      "components/easecraft/compositions/expandable-project-card.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "@radix-ui/react-accordion", type: "npm", version: "1.2.20" },
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });

  it("creates package and copy-source Notification Center plans", () => {
    const packagePlan = getCompositionInstallPlan("notification-center", "package");
    const copySourcePlan = getCompositionInstallPlan("notification-center", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["toast-stack"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/toast-stack.tsx",
      "components/easecraft/compositions/notification-center-core.tsx",
      "components/easecraft/compositions/notification-center.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "@radix-ui/react-toast", type: "npm", version: "1.2.23" },
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });

  it("creates package and copy-source Filterable Work Gallery plans", () => {
    const packagePlan = getCompositionInstallPlan("filterable-work-gallery", "package");
    const copySourcePlan = getCompositionInstallPlan("filterable-work-gallery", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["filter-grid"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/use-anime.ts",
      "components/easecraft/stagger.tsx",
      "components/easecraft/staggered-list.tsx",
      "components/easecraft/filter-grid.tsx",
      "components/easecraft/compositions/filterable-work-gallery-core.tsx",
      "components/easecraft/compositions/filterable-work-gallery.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });

  it("creates package and copy-source Onboarding Progress Sequence plans", () => {
    const packagePlan = getCompositionInstallPlan("onboarding-progress-sequence", "package");
    const copySourcePlan = getCompositionInstallPlan("onboarding-progress-sequence", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["animated-tabs"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/animated-tabs.tsx",
      "components/easecraft/compositions/onboarding-progress-sequence-core.tsx",
      "components/easecraft/compositions/onboarding-progress-sequence.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });

  it("creates package and copy-source Mobile Navigation Panel plans", () => {
    const packagePlan = getCompositionInstallPlan("mobile-navigation-panel", "package");
    const copySourcePlan = getCompositionInstallPlan("mobile-navigation-panel", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["motion-dialog"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/motion-dialog.tsx",
      "components/easecraft/compositions/mobile-navigation-panel-core.tsx",
      "components/easecraft/compositions/mobile-navigation-panel.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "@radix-ui/react-dialog", type: "npm", version: "1.1.23" },
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });

  it("creates package and copy-source Animated Pricing Comparison plans", () => {
    const packagePlan = getCompositionInstallPlan("animated-pricing-comparison", "package");
    const copySourcePlan = getCompositionInstallPlan("animated-pricing-comparison", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["number-ticker"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/use-anime.ts",
      "components/easecraft/number-ticker.tsx",
      "components/easecraft/compositions/animated-pricing-comparison-core.tsx",
      "components/easecraft/compositions/animated-pricing-comparison.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });

  it("creates package and copy-source Scroll-driven Article Timeline plans", () => {
    const packagePlan = getCompositionInstallPlan("scroll-driven-article-timeline", "package");
    const copySourcePlan = getCompositionInstallPlan(
      "scroll-driven-article-timeline",
      "copy-source",
    );

    expect(packagePlan.componentDependencies).toEqual(["scroll-reveal"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: reactVersion },
    ]);
    expect(copySourcePlan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/scroll-reveal.tsx",
      "components/easecraft/compositions/scroll-driven-article-timeline-core.tsx",
      "components/easecraft/compositions/scroll-driven-article-timeline.tsx",
    ]);
    expect(copySourcePlan.dependencies.npm).toEqual([
      { name: "animejs", type: "npm", version: "4.5.0" },
    ]);
  });
});
