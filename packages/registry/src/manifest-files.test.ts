import { existsSync, readFileSync } from "node:fs";
import { posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSourceFile, isImportDeclaration, ScriptKind, ScriptTarget } from "typescript";
import { describe, expect, it } from "vitest";

import {
  componentRegistry,
  componentSlugs,
  compositionManifests,
  compositionSlugs,
  copySourceManifests,
  getCompositionInstallPlan,
  getInstallPlan,
  type CopySourceFile,
  type InstallDependencyGroups,
} from "./index.js";

interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
  readonly version: string;
}

const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

function readPackageManifest(path: string): PackageManifest {
  return JSON.parse(readFileSync(resolve(workspaceRoot, path), "utf8")) as PackageManifest;
}

function packageName(specifier: string): string {
  const parts = specifier.split("/");

  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier);
}

function resolveRelativeImport(
  destinationPath: string,
  specifier: string,
  destinations: ReadonlySet<string>,
): string | undefined {
  const unresolvedPath = posix.normalize(posix.join(posix.dirname(destinationPath), specifier));
  const candidates = specifier.endsWith(".js")
    ? [unresolvedPath.slice(0, -3) + ".ts", unresolvedPath.slice(0, -3) + ".tsx"]
    : [`${unresolvedPath}.ts`, `${unresolvedPath}.tsx`];

  return candidates.find((candidate) => destinations.has(candidate));
}

function validatePlanImports(
  label: string,
  files: readonly CopySourceFile[],
  dependencies: InstallDependencyGroups,
) {
  const destinations = new Set(files.map((file) => file.destinationPath));
  const dependencyNames = new Set(
    [...dependencies.npm, ...dependencies.peer, ...dependencies.workspace].map(
      (dependency) => dependency.name,
    ),
  );

  files.forEach((file) => {
    const sourcePath = resolve(workspaceRoot, file.sourcePath);
    const source = createSourceFile(
      sourcePath,
      readFileSync(sourcePath, "utf8"),
      ScriptTarget.Latest,
      true,
      sourcePath.endsWith(".tsx") ? ScriptKind.TSX : ScriptKind.TS,
    );

    source.statements.forEach((statement) => {
      if (!isImportDeclaration(statement) || !statement.moduleSpecifier.getText(source)) {
        return;
      }

      const specifier = statement.moduleSpecifier.getText(source).slice(1, -1);

      if (specifier.startsWith(".")) {
        const importedDestination = resolveRelativeImport(
          file.destinationPath,
          specifier,
          destinations,
        );

        expect(importedDestination, `${label}:${file.destinationPath}:${specifier}`).toBeDefined();
      } else {
        expect(dependencyNames.has(packageName(specifier)), `${label}:${specifier}`).toBe(true);
      }
    });
  });
}

describe("copy-source workspace references", () => {
  it("references source files that exist in the React package", () => {
    Object.values(copySourceManifests).forEach((manifest) => {
      manifest.files.forEach((file) => {
        expect(existsSync(resolve(workspaceRoot, file.sourcePath)), file.sourcePath).toBe(true);
      });
    });

    Object.values(compositionManifests).forEach((manifest) => {
      [...manifest.packageFiles, ...manifest.copySourceFiles].forEach((file) => {
        expect(existsSync(resolve(workspaceRoot, file.sourcePath)), file.sourcePath).toBe(true);
      });
    });
  });

  it("keeps dependency versions synchronized with package manifests", () => {
    const reactPackage = readPackageManifest("packages/react/package.json");
    const tokensPackage = readPackageManifest("packages/tokens/package.json");

    componentRegistry.forEach((component) => {
      component.dependencies.forEach((dependency) => {
        if (dependency.type === "npm") {
          expect(dependency.version, `${component.slug}:${dependency.name}`).toBe(
            reactPackage.dependencies?.[dependency.name],
          );
        } else if (dependency.type === "peer") {
          expect(dependency.version, `${component.slug}:${dependency.name}`).toBe(
            reactPackage.peerDependencies?.[dependency.name],
          );
        } else if (dependency.name === "easecraft-tokens") {
          expect(dependency.version).toBe(tokensPackage.version);
        }
      });

      expect(getInstallPlan(component.slug, "package").dependencies.npm).toEqual([
        { name: "easecraft", type: "npm", version: reactPackage.version },
      ]);
    });
  });

  it("includes every relative import and declares every external import", () => {
    componentSlugs.forEach((slug) => {
      const plan = getInstallPlan(slug, "copy-source");
      validatePlanImports(slug, plan.files, plan.dependencies);
    });

    compositionSlugs.forEach((slug) => {
      (["package", "copy-source"] as const).forEach((mode) => {
        const plan = getCompositionInstallPlan(slug, mode);
        validatePlanImports(`${slug}:${mode}`, plan.files, plan.dependencies);
      });
    });
  });
});
