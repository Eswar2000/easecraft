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
  it("defines the Command Palette proving composition", () => {
    expect(compositionCategories).toEqual([
      "Navigation",
      "Commerce",
      "Feedback",
      "Content",
      "Workflow",
    ]);
    expect(compositionSlugs).toEqual(["command-palette"]);
    expect(listCompositions()).toBe(compositionRegistry);
    expect(getComposition("command-palette")).toMatchObject({
      category: "Navigation",
      componentDependencies: ["motion-dialog"],
      name: "Command Palette",
      status: "implemented",
    });
    expect(findComposition("missing-composition")).toBeUndefined();
    expect(isCompositionSlug("command-palette")).toBe(true);
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
});
