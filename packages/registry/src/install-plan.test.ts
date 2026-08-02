import { describe, expect, it } from "vitest";

import { version as reactVersion } from "../../react/package.json";
import { version as tokensVersion } from "../../tokens/package.json";
import {
  componentSlugs,
  copySourceManifests,
  defineCopySourceManifests,
  getInstallCommand,
  getInstallPlan,
  registryDeliveryModes,
  registryPackageManagers,
  type ComponentSlug,
  type CopySourceFile,
} from "./index.js";

function testFile(name: string, role: CopySourceFile["role"] = "component"): CopySourceFile {
  return {
    destinationPath: `components/easecraft/${name}.tsx`,
    role,
    sourcePath: `packages/react/src/${name}.tsx`,
  };
}

describe("copySourceManifests", () => {
  it("defines one complete manifest for every registered component", () => {
    expect(Object.keys(copySourceManifests).sort()).toEqual([...componentSlugs].sort());

    componentSlugs.forEach((slug) => {
      const manifest = copySourceManifests[slug];

      expect(manifest.slug).toBe(slug);
      expect(manifest.files.filter((file) => file.role === "component")).toEqual([
        {
          destinationPath: `components/easecraft/${slug}.tsx`,
          role: "component",
          sourcePath: `packages/react/src/${slug}.tsx`,
        },
      ]);
    });
  });

  it("rejects duplicate destination paths", () => {
    expect(() =>
      defineCopySourceManifests(["alpha"] as const, {
        alpha: {
          files: [
            testFile("alpha"),
            {
              ...testFile("provider", "provider"),
              destinationPath: "components/easecraft/alpha.tsx",
            },
          ],
          registryDependencies: [],
          slug: "alpha",
        },
      }),
    ).toThrow(
      "Component registry received a duplicate alpha destination path: components/easecraft/alpha.tsx",
    );
  });

  it("rejects unknown registry dependencies", () => {
    const slugs: readonly string[] = ["alpha"];

    expect(() =>
      defineCopySourceManifests(slugs, {
        alpha: {
          files: [testFile("alpha")],
          registryDependencies: ["missing"],
          slug: "alpha",
        },
      }),
    ).toThrow("Copy-source manifest alpha references an unknown registry dependency: missing");
  });

  it("rejects registry dependency cycles with the complete cycle path", () => {
    expect(() =>
      defineCopySourceManifests(["alpha", "beta"] as const, {
        alpha: {
          files: [testFile("alpha")],
          registryDependencies: ["beta"],
          slug: "alpha",
        },
        beta: {
          files: [testFile("beta")],
          registryDependencies: ["alpha"],
          slug: "beta",
        },
      }),
    ).toThrow("Copy-source registry dependency cycle: alpha -> beta -> alpha");
  });

  it("rejects unsafe source and destination paths", () => {
    expect(() =>
      defineCopySourceManifests(["alpha"] as const, {
        alpha: {
          files: [{ ...testFile("alpha"), sourcePath: "../alpha.tsx" }],
          registryDependencies: [],
          slug: "alpha",
        },
      }),
    ).toThrow("Copy-source alpha source path must be a safe relative path: ../alpha.tsx");
  });
});

describe("getInstallPlan", () => {
  it("exposes the supported delivery modes and package managers", () => {
    expect(registryDeliveryModes).toEqual(["package", "copy-source"]);
    expect(registryPackageManagers).toEqual(["npm", "pnpm", "yarn", "bun"]);
  });

  it("creates a package plan without copy-source files", () => {
    const plan = getInstallPlan("animated-accordion", "package");

    expect(plan).toEqual({
      dependencies: {
        npm: [{ name: "easecraft", type: "npm", version: reactVersion }],
        peer: [
          { name: "react", type: "peer", version: ">=18.2.0 <20.0.0" },
          { name: "react-dom", type: "peer", version: ">=18.2.0 <20.0.0" },
        ],
        workspace: [],
      },
      files: [],
      mode: "package",
      registryDependencies: [],
      slug: "animated-accordion",
    });
    expect(getInstallCommand(plan)).toBe(`pnpm add easecraft@${reactVersion}`);
  });

  it("resolves shared files and external dependencies for copy-source mode", () => {
    const plan = getInstallPlan("text-reveal", "copy-source");

    expect(plan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/use-anime.ts",
      "components/easecraft/text-reveal.tsx",
    ]);
    expect(plan.dependencies).toEqual({
      npm: [{ name: "animejs", type: "npm", version: "4.5.0" }],
      peer: [
        { name: "react", type: "peer", version: ">=18.2.0 <20.0.0" },
        { name: "react-dom", type: "peer", version: ">=18.2.0 <20.0.0" },
      ],
      workspace: [{ name: "easecraft-tokens", type: "workspace", version: tokensVersion }],
    });
    expect(getInstallCommand(plan, "pnpm")).toBe(
      `pnpm add animejs@4.5.0 easecraft-tokens@${tokensVersion}`,
    );
    expect(getInstallCommand(plan, "npm")).toBe(
      `npm install animejs@4.5.0 easecraft-tokens@${tokensVersion}`,
    );
    expect(getInstallCommand(plan, "yarn")).toBe(
      `yarn add animejs@4.5.0 easecraft-tokens@${tokensVersion}`,
    );
    expect(getInstallCommand(plan, "bun")).toBe(
      `bun add animejs@4.5.0 easecraft-tokens@${tokensVersion}`,
    );
  });

  it("resolves registry dependencies before the requested component", () => {
    const plan = getInstallPlan("filter-grid", "copy-source");

    expect(plan.registryDependencies).toEqual(["staggered-list"]);
    expect(plan.files.map((file) => file.destinationPath)).toEqual([
      "components/easecraft/motion-provider.tsx",
      "components/easecraft/use-anime.ts",
      "components/easecraft/stagger.tsx",
      "components/easecraft/staggered-list.tsx",
      "components/easecraft/filter-grid.tsx",
    ]);
  });

  it("produces deterministic, collision-free plans for all components", () => {
    componentSlugs.forEach((slug: ComponentSlug) => {
      const firstPlan = getInstallPlan(slug, "copy-source");
      const secondPlan = getInstallPlan(slug, "copy-source");
      const destinations = firstPlan.files.map((file) => file.destinationPath);

      expect(secondPlan).toEqual(firstPlan);
      expect(new Set(destinations).size).toBe(destinations.length);
      expect(destinations.at(-1)).toBe(`components/easecraft/${slug}.tsx`);
    });
  });
});
