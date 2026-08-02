import { version as reactVersion } from "../../react/package.json";
import { componentEntries, type ComponentSlug } from "./components.js";
import { compositionManifests } from "./composition-manifests.js";
import { compositionEntries, type CompositionSlug } from "./compositions.js";
import { copySourceManifests } from "./manifests.js";
import type {
  ComponentDependency,
  ComponentInstallPlan,
  CompositionInstallPlan,
  CopySourceFile,
  CopySourceCompositionInstallPlan,
  CopySourceInstallPlan,
  InstallDependencyGroups,
  PackageCompositionInstallPlan,
  PackageInstallPlan,
  RegistryDeliveryMode,
  RegistryInstallPlan,
  RegistryPackageManager,
} from "./schema.js";

const easecraftPackage: ComponentDependency = {
  name: "easecraft",
  type: "npm",
  version: reactVersion,
};

const componentBySlug = new Map(componentEntries.map((component) => [component.slug, component]));
const compositionBySlug = new Map(
  compositionEntries.map((composition) => [composition.slug, composition]),
);

function resolveRegistryDependencies(slug: ComponentSlug): readonly ComponentSlug[] {
  const resolved: ComponentSlug[] = [];
  const visited = new Set<ComponentSlug>();

  function visit(currentSlug: ComponentSlug) {
    copySourceManifests[currentSlug].registryDependencies.forEach((dependency) => {
      if (!visited.has(dependency)) {
        visit(dependency);
        visited.add(dependency);
        resolved.push(dependency);
      }
    });
  }

  visit(slug);
  return resolved;
}

function groupDependencies(dependencies: readonly ComponentDependency[]): InstallDependencyGroups {
  const uniqueDependencies = new Map<string, ComponentDependency>();

  dependencies.forEach((dependency) => {
    const existing = uniqueDependencies.get(dependency.name);

    if (
      existing &&
      (existing.type !== dependency.type || existing.version !== dependency.version)
    ) {
      throw new Error(
        `Install plan received conflicting dependency metadata for ${dependency.name}.`,
      );
    }

    uniqueDependencies.set(dependency.name, dependency);
  });

  const sorted = [...uniqueDependencies.values()].sort((first, second) =>
    first.name < second.name ? -1 : first.name > second.name ? 1 : 0,
  );

  return {
    npm: sorted.filter((dependency) => dependency.type === "npm"),
    peer: sorted.filter((dependency) => dependency.type === "peer"),
    workspace: sorted.filter((dependency) => dependency.type === "workspace"),
  };
}

function resolveCopySourceFiles(
  slug: ComponentSlug,
  registryDependencies: readonly ComponentSlug[],
): readonly CopySourceFile[] {
  const filesByDestination = new Map<string, CopySourceFile>();

  [...registryDependencies, slug].forEach((currentSlug) => {
    copySourceManifests[currentSlug].files.forEach((file) => {
      const existing = filesByDestination.get(file.destinationPath);

      if (existing && existing.sourcePath !== file.sourcePath) {
        throw new Error(
          `Install plan destination collision: ${file.destinationPath} maps to both ${existing.sourcePath} and ${file.sourcePath}.`,
        );
      }

      filesByDestination.set(file.destinationPath, file);
    });
  });

  return [...filesByDestination.values()];
}

function mergeFiles(fileGroups: readonly (readonly CopySourceFile[])[]): readonly CopySourceFile[] {
  const filesByDestination = new Map<string, CopySourceFile>();

  fileGroups.forEach((files) => {
    files.forEach((file) => {
      const existing = filesByDestination.get(file.destinationPath);

      if (existing && existing.sourcePath !== file.sourcePath) {
        throw new Error(
          `Install plan destination collision: ${file.destinationPath} maps to both ${existing.sourcePath} and ${file.sourcePath}.`,
        );
      }

      filesByDestination.set(file.destinationPath, file);
    });
  });

  return [...filesByDestination.values()];
}

function flattenDependencies(groups: InstallDependencyGroups): readonly ComponentDependency[] {
  return [...groups.npm, ...groups.peer, ...groups.workspace];
}

function getComponentDependencies(slugs: readonly ComponentSlug[]): readonly ComponentDependency[] {
  return slugs.flatMap((slug) => {
    const component = componentBySlug.get(slug);

    if (!component) {
      throw new Error(`Unknown Easecraft component: ${slug}`);
    }

    return component.dependencies;
  });
}

function getPackageInstallPlan(slug: ComponentSlug): PackageInstallPlan<ComponentSlug> {
  const component = componentBySlug.get(slug);

  if (!component) {
    throw new Error(`Unknown Easecraft component: ${slug}`);
  }

  return {
    dependencies: groupDependencies([
      easecraftPackage,
      ...component.dependencies.filter((dependency) => dependency.type === "peer"),
    ]),
    files: [],
    mode: "package",
    registryDependencies: [],
    slug,
  };
}

function getCopySourceInstallPlan(slug: ComponentSlug): CopySourceInstallPlan<ComponentSlug> {
  const registryDependencies = resolveRegistryDependencies(slug);

  return {
    dependencies: groupDependencies(getComponentDependencies([...registryDependencies, slug])),
    files: resolveCopySourceFiles(slug, registryDependencies),
    mode: "copy-source",
    registryDependencies,
    slug,
  };
}

export function getInstallPlan(
  slug: ComponentSlug,
  mode: "package",
): PackageInstallPlan<ComponentSlug>;
export function getInstallPlan(
  slug: ComponentSlug,
  mode: "copy-source",
): CopySourceInstallPlan<ComponentSlug>;
export function getInstallPlan(
  slug: ComponentSlug,
  mode: RegistryDeliveryMode,
): ComponentInstallPlan<ComponentSlug> {
  return mode === "package" ? getPackageInstallPlan(slug) : getCopySourceInstallPlan(slug);
}

function getPackageCompositionInstallPlan(
  slug: CompositionSlug,
): PackageCompositionInstallPlan<CompositionSlug, ComponentSlug> {
  const composition = compositionBySlug.get(slug);

  if (!composition) {
    throw new Error(`Unknown Easecraft composition: ${slug}`);
  }

  const componentPlans = composition.componentDependencies.map((dependency) =>
    getPackageInstallPlan(dependency),
  );

  return {
    componentDependencies: composition.componentDependencies,
    dependencies: groupDependencies(
      componentPlans.flatMap((plan) => flattenDependencies(plan.dependencies)),
    ),
    files: compositionManifests[slug].packageFiles,
    mode: "package",
    slug,
  };
}

function getCopySourceCompositionInstallPlan(
  slug: CompositionSlug,
): CopySourceCompositionInstallPlan<CompositionSlug, ComponentSlug> {
  const composition = compositionBySlug.get(slug);

  if (!composition) {
    throw new Error(`Unknown Easecraft composition: ${slug}`);
  }

  const componentPlans = composition.componentDependencies.map((dependency) =>
    getCopySourceInstallPlan(dependency),
  );

  return {
    componentDependencies: composition.componentDependencies,
    dependencies: groupDependencies(
      componentPlans.flatMap((plan) => flattenDependencies(plan.dependencies)),
    ),
    files: mergeFiles([
      ...componentPlans.map((plan) => plan.files),
      compositionManifests[slug].copySourceFiles,
    ]),
    mode: "copy-source",
    slug,
  };
}

export function getCompositionInstallPlan(
  slug: CompositionSlug,
  mode: "package",
): PackageCompositionInstallPlan<CompositionSlug, ComponentSlug>;
export function getCompositionInstallPlan(
  slug: CompositionSlug,
  mode: "copy-source",
): CopySourceCompositionInstallPlan<CompositionSlug, ComponentSlug>;
export function getCompositionInstallPlan(
  slug: CompositionSlug,
  mode: RegistryDeliveryMode,
): CompositionInstallPlan<CompositionSlug, ComponentSlug>;
export function getCompositionInstallPlan(
  slug: CompositionSlug,
  mode: RegistryDeliveryMode,
): CompositionInstallPlan<CompositionSlug, ComponentSlug> {
  return mode === "package"
    ? getPackageCompositionInstallPlan(slug)
    : getCopySourceCompositionInstallPlan(slug);
}

function dependencySpecifier(dependency: ComponentDependency): string {
  return `${dependency.name}@${dependency.version}`;
}

export function getInstallCommand(
  plan: RegistryInstallPlan<ComponentSlug, CompositionSlug>,
  packageManager: RegistryPackageManager = "pnpm",
): string {
  const packages = [...plan.dependencies.npm, ...plan.dependencies.workspace].map(
    dependencySpecifier,
  );

  const command =
    packageManager === "npm"
      ? "npm install"
      : packageManager === "yarn"
        ? "yarn add"
        : packageManager === "bun"
          ? "bun add"
          : "pnpm add";

  return `${command} ${packages.join(" ")}`;
}
