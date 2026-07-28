import { componentEntries, type ComponentSlug } from "./components.js";
import {
  defineComponentRegistry,
  type ComponentCategory,
  type ComponentRegistryEntry,
} from "./schema.js";

export const componentRegistry = defineComponentRegistry(componentEntries);

export type RegisteredComponent = Omit<ComponentRegistryEntry, "slug"> & {
  readonly slug: ComponentSlug;
};

export const componentSlugs = componentRegistry.map(
  (component) => component.slug,
) as readonly ComponentSlug[];

const componentBySlug = new Map<string, RegisteredComponent>(
  componentRegistry.map((component) => [component.slug, component]),
);

export function isComponentSlug(value: string): value is ComponentSlug {
  return componentBySlug.has(value);
}

export function findComponent(value: string): RegisteredComponent | undefined {
  return componentBySlug.get(value);
}

export function getComponent(slug: ComponentSlug): RegisteredComponent {
  const component = findComponent(slug);

  if (!component) {
    throw new Error(`Unknown Easecraft component: ${slug}`);
  }

  return component;
}

export function listComponents(): readonly RegisteredComponent[] {
  return componentRegistry;
}

export function listComponentsByCategory(
  category: ComponentCategory,
): readonly RegisteredComponent[] {
  return componentRegistry.filter((component) => component.category === category);
}

export {
  componentCategories,
  defineComponentRegistry,
  defineCopySourceManifests,
  registryDeliveryModes,
  registryPackageManagers,
  type ComponentInstallPlan,
  type ComponentAccessibility,
  type ComponentAnnouncement,
  type ComponentCategory,
  type ComponentDependency,
  type ComponentDependencyType,
  type ComponentKeyboardInteraction,
  type ComponentMotionCapabilities,
  type ComponentRegistryEntry,
  type ComponentSourceFile,
  type ComponentSourceRole,
  type ComponentStatus,
  type CopySourceFile,
  type CopySourceFileRole,
  type CopySourceInstallPlan,
  type CopySourceManifest,
  type CopySourceManifestMap,
  type InstallDependencyGroups,
  type PackageInstallPlan,
  type RegistryDeliveryMode,
  type RegistryPackageManager,
} from "./schema.js";

export { getInstallCommand, getInstallPlan } from "./install-plan.js";
export { copySourceManifests } from "./manifests.js";
export type { ComponentSlug } from "./components.js";
