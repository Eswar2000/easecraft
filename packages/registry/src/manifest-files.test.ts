import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSourceFile, isImportDeclaration, ScriptKind, ScriptTarget } from "typescript";
import { describe, expect, it } from "vitest";

import { componentRegistry, componentSlugs, copySourceManifests, getInstallPlan } from "./index.js";

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

function resolveRelativeImport(sourcePath: string, specifier: string): string | undefined {
  const unresolvedPath = resolve(dirname(sourcePath), specifier);
  const candidates = specifier.endsWith(".js")
    ? [unresolvedPath.slice(0, -3) + ".ts", unresolvedPath.slice(0, -3) + ".tsx"]
    : [`${unresolvedPath}.ts`, `${unresolvedPath}.tsx`];

  return candidates.find((candidate) => existsSync(candidate));
}

describe("copy-source workspace references", () => {
  it("references source files that exist in the React package", () => {
    Object.values(copySourceManifests).forEach((manifest) => {
      manifest.files.forEach((file) => {
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
      const sourcePaths = new Set(
        plan.files.map((file) => resolve(workspaceRoot, file.sourcePath)),
      );
      const dependencyNames = new Set(
        [...plan.dependencies.npm, ...plan.dependencies.peer, ...plan.dependencies.workspace].map(
          (dependency) => dependency.name,
        ),
      );

      sourcePaths.forEach((sourcePath) => {
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
            const importedSource = resolveRelativeImport(sourcePath, specifier);

            expect(importedSource, `${slug}:${sourcePath}:${specifier}`).toBeDefined();
            expect(sourcePaths.has(importedSource ?? ""), `${slug}:${specifier}`).toBe(true);
          } else {
            expect(dependencyNames.has(packageName(specifier)), `${slug}:${specifier}`).toBe(true);
          }
        });
      });
    });
  });
});
