export const componentCategories = ["Text", "Layout", "Overlay", "Feedback"] as const;
export const registryDeliveryModes = ["package", "copy-source"] as const;
export const registryPackageManagers = ["npm", "pnpm", "yarn", "bun"] as const;

export type ComponentCategory = (typeof componentCategories)[number];
export type ComponentStatus = "implemented" | "planned";
export type ComponentAnnouncement = "none" | "optional" | "polite" | "assertive" | "configurable";
export type ComponentDependencyType = "npm" | "peer" | "workspace";
export type ComponentSourceRole = "implementation" | "unit-test" | "integration-test";
export type CopySourceFileRole = "component" | "hook" | "provider" | "utility";
export type RegistryDeliveryMode = (typeof registryDeliveryModes)[number];
export type RegistryPackageManager = (typeof registryPackageManagers)[number];

export interface ComponentDependency {
  readonly name: string;
  readonly type: ComponentDependencyType;
  readonly version: string;
}

export interface ComponentSourceFile {
  readonly path: string;
  readonly role: ComponentSourceRole;
}

export interface CopySourceFile {
  readonly destinationPath: string;
  readonly role: CopySourceFileRole;
  readonly sourcePath: string;
}

export interface CopySourceManifest<Slug extends string = string> {
  readonly files: readonly CopySourceFile[];
  readonly registryDependencies: readonly Slug[];
  readonly slug: Slug;
}

export type CopySourceManifestMap<Slug extends string> = {
  readonly [Key in Slug]: CopySourceManifest<Slug> & { readonly slug: Key };
};

export interface InstallDependencyGroups {
  readonly npm: readonly ComponentDependency[];
  readonly peer: readonly ComponentDependency[];
  readonly workspace: readonly ComponentDependency[];
}

interface ComponentInstallPlanBase<Slug extends string> {
  readonly dependencies: InstallDependencyGroups;
  readonly registryDependencies: readonly Slug[];
  readonly slug: Slug;
}

export interface PackageInstallPlan<
  Slug extends string = string,
> extends ComponentInstallPlanBase<Slug> {
  readonly files: readonly [];
  readonly mode: "package";
}

export interface CopySourceInstallPlan<
  Slug extends string = string,
> extends ComponentInstallPlanBase<Slug> {
  readonly files: readonly CopySourceFile[];
  readonly mode: "copy-source";
}

export type ComponentInstallPlan<Slug extends string = string> =
  PackageInstallPlan<Slug> | CopySourceInstallPlan<Slug>;

export interface ComponentMotionCapabilities {
  readonly controlled: boolean;
  readonly enter: boolean;
  readonly exit: boolean;
  readonly intrinsicSize: boolean;
  readonly layout: boolean;
  readonly reducedMotion: boolean;
  readonly replay: boolean;
  readonly viewport: boolean;
}

export interface ComponentKeyboardInteraction {
  readonly behavior: string;
  readonly keys: readonly string[];
}

export interface ComponentAccessibility {
  readonly announcement: ComponentAnnouncement;
  readonly focusManagement: boolean;
  readonly keyboard: readonly ComponentKeyboardInteraction[];
  readonly notes: readonly string[];
  readonly pattern: string;
}

export interface ComponentRegistryEntry {
  readonly accessibility: ComponentAccessibility;
  readonly category: ComponentCategory;
  readonly dependencies: readonly ComponentDependency[];
  readonly description: string;
  readonly docsPath: `/components/${string}`;
  readonly exportName: string;
  readonly motion: ComponentMotionCapabilities;
  readonly name: string;
  readonly packageName: "easecraft";
  readonly slug: string;
  readonly sourceFiles: readonly ComponentSourceFile[];
  readonly status: ComponentStatus;
}

function assertNonEmpty(value: string, field: string) {
  if (value.trim().length === 0) {
    throw new Error(`Component registry ${field} must not be empty.`);
  }
}

function assertUnique(seen: Set<string>, value: string, field: string) {
  if (seen.has(value)) {
    throw new Error(`Component registry received a duplicate ${field}: ${value}`);
  }

  seen.add(value);
}

function assertSafeRelativePath(path: string, field: string) {
  assertNonEmpty(path, field);

  if (
    path.startsWith("/") ||
    path.startsWith("\\") ||
    /^[a-z]:/iu.test(path) ||
    path.split(/[\\/]/u).includes("..")
  ) {
    throw new Error(`Copy-source ${field} must be a safe relative path: ${path}`);
  }
}

export function defineCopySourceManifests<
  const Slugs extends readonly string[],
  const Manifests extends CopySourceManifestMap<Slugs[number]>,
>(componentSlugs: Slugs, manifests: Manifests): Manifests {
  const expectedSlugs = new Set<string>(componentSlugs);
  const manifestKeys = Object.keys(manifests);

  manifestKeys.forEach((key) => {
    if (!expectedSlugs.has(key)) {
      throw new Error(`Copy-source manifest references an unknown component: ${key}`);
    }
  });

  componentSlugs.forEach((slug) => {
    if (!Object.hasOwn(manifests, slug)) {
      throw new Error(`Copy-source manifest is missing component: ${slug}`);
    }
  });

  manifestKeys.forEach((key) => {
    const manifest = manifests[key as keyof Manifests] as CopySourceManifest;

    if (manifest.slug !== key) {
      throw new Error(`Copy-source manifest key must match its slug: ${key} -> ${manifest.slug}`);
    }

    if (manifest.files.length === 0) {
      throw new Error(`Copy-source manifest ${key} must declare at least one file.`);
    }

    const sourcePaths = new Set<string>();
    const destinationPaths = new Set<string>();
    let componentFileCount = 0;

    manifest.files.forEach((file) => {
      assertSafeRelativePath(file.sourcePath, `${key} source path`);
      assertSafeRelativePath(file.destinationPath, `${key} destination path`);
      assertUnique(sourcePaths, file.sourcePath, `${key} source path`);
      assertUnique(destinationPaths, file.destinationPath, `${key} destination path`);

      if (file.role === "component") {
        componentFileCount += 1;
      }
    });

    if (componentFileCount !== 1) {
      throw new Error(
        `Copy-source manifest ${key} must declare exactly one component file; received ${componentFileCount.toString()}.`,
      );
    }

    const registryDependencies = new Set<string>();
    manifest.registryDependencies.forEach((dependency) => {
      assertUnique(registryDependencies, dependency, `${key} registry dependency`);

      if (!expectedSlugs.has(dependency)) {
        throw new Error(
          `Copy-source manifest ${key} references an unknown registry dependency: ${dependency}`,
        );
      }
    });
  });

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(slug: string, path: readonly string[]) {
    if (visiting.has(slug)) {
      const cycleStart = path.indexOf(slug);
      const cycle = [...path.slice(cycleStart), slug];
      throw new Error(`Copy-source registry dependency cycle: ${cycle.join(" -> ")}`);
    }

    if (visited.has(slug)) {
      return;
    }

    visiting.add(slug);
    const manifest = manifests[slug as keyof Manifests] as CopySourceManifest;
    manifest.registryDependencies.forEach((dependency) => {
      visit(dependency, [...path, slug]);
    });
    visiting.delete(slug);
    visited.add(slug);
  }

  componentSlugs.forEach((slug) => {
    visit(slug, []);
  });

  return manifests;
}

export function defineComponentRegistry<const Entries extends readonly ComponentRegistryEntry[]>(
  entries: Entries,
): Entries {
  const docsPaths = new Set<string>();
  const exportNames = new Set<string>();
  const slugs = new Set<string>();

  entries.forEach((entry) => {
    assertNonEmpty(entry.description, `${entry.slug} description`);
    assertNonEmpty(entry.exportName, `${entry.slug} export name`);
    assertNonEmpty(entry.name, `${entry.slug} name`);
    assertNonEmpty(entry.slug, "slug");
    assertNonEmpty(entry.accessibility.pattern, `${entry.slug} accessibility pattern`);

    assertUnique(slugs, entry.slug, "slug");
    assertUnique(exportNames, entry.exportName, "export name");
    assertUnique(docsPaths, entry.docsPath, "docs path");

    if (entry.docsPath !== `/components/${entry.slug}`) {
      throw new Error(
        `Component registry docs path must match its slug: ${entry.slug} -> ${entry.docsPath}`,
      );
    }

    if (entry.sourceFiles.length === 0) {
      throw new Error(`Component registry ${entry.slug} must declare at least one source file.`);
    }

    const dependencies = new Set<string>();
    entry.dependencies.forEach((dependency) => {
      assertNonEmpty(dependency.name, `${entry.slug} dependency name`);
      assertNonEmpty(dependency.version, `${entry.slug} dependency version`);
      assertUnique(
        dependencies,
        `${dependency.type}:${dependency.name}`,
        `${entry.slug} dependency`,
      );
    });

    const sourceFiles = new Set<string>();
    entry.sourceFiles.forEach((sourceFile) => {
      assertNonEmpty(sourceFile.path, `${entry.slug} source file path`);
      assertUnique(sourceFiles, sourceFile.path, `${entry.slug} source file`);
    });
  });

  return entries;
}
