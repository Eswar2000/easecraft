export const componentCategories = ["Text", "Layout", "Overlay", "Feedback"] as const;

export type ComponentCategory = (typeof componentCategories)[number];
export type ComponentStatus = "implemented" | "planned";
export type ComponentAnnouncement = "none" | "optional" | "polite" | "assertive" | "configurable";
export type ComponentDependencyType = "runtime" | "peer" | "workspace";
export type ComponentSourceRole = "implementation" | "unit-test" | "integration-test";

export interface ComponentDependency {
  readonly name: string;
  readonly type: ComponentDependencyType;
}

export interface ComponentSourceFile {
  readonly path: string;
  readonly role: ComponentSourceRole;
}

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
