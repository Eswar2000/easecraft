import { describe, expect, it } from "vitest";

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
    expect(plan.dependencies.npm).toEqual([{ name: "easecraft", type: "npm", version: "0.0.0" }]);
    expect(getInstallCommand(plan)).toBe("pnpm add easecraft@0.0.0");
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
      "pnpm add @radix-ui/react-dialog@1.1.23 animejs@4.5.0 easecraft-tokens@0.0.0",
    );
  });

  it("creates package and copy-source Expandable Project Card plans", () => {
    const packagePlan = getCompositionInstallPlan("expandable-project-card", "package");
    const copySourcePlan = getCompositionInstallPlan("expandable-project-card", "copy-source");

    expect(packagePlan.componentDependencies).toEqual(["animated-accordion"]);
    expect(packagePlan.dependencies.npm).toEqual([
      { name: "easecraft", type: "npm", version: "0.0.0" },
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
      { name: "easecraft", type: "npm", version: "0.0.0" },
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
      { name: "easecraft", type: "npm", version: "0.0.0" },
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
});
