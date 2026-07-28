import { componentEntries, type ComponentSlug } from "./components.js";
import { compositionEntries, type CompositionSlug } from "./compositions.js";
import {
  defineComponentRegistry,
  type ComponentCategory,
  type ComponentRegistryEntry,
} from "./schema.js";

export const componentRegistry = defineComponentRegistry(componentEntries);
export const compositionRegistry = compositionEntries;

export type RegisteredComponent = Omit<ComponentRegistryEntry, "slug"> & {
  readonly slug: ComponentSlug;
};
export type RegisteredComposition = (typeof compositionRegistry)[number];

export const componentSlugs = componentRegistry.map(
  (component) => component.slug,
) as readonly ComponentSlug[];
export const compositionSlugs = compositionRegistry.map(
  (composition) => composition.slug,
) as readonly CompositionSlug[];

const componentBySlug = new Map<string, RegisteredComponent>(
  componentRegistry.map((component) => [component.slug, component]),
);
const compositionBySlug = new Map<string, RegisteredComposition>(
  compositionRegistry.map((composition) => [composition.slug, composition]),
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

export function isCompositionSlug(value: string): value is CompositionSlug {
  return compositionBySlug.has(value);
}

export function findComposition(value: string): RegisteredComposition | undefined {
  return compositionBySlug.get(value);
}

export function getComposition(slug: CompositionSlug): RegisteredComposition {
  const composition = findComposition(slug);

  if (!composition) {
    throw new Error(`Unknown Easecraft composition: ${slug}`);
  }

  return composition;
}

export function listCompositions(): readonly RegisteredComposition[] {
  return compositionRegistry;
}

export {
  componentCategories,
  compositionCategories,
  defineComponentRegistry,
  defineCompositionManifests,
  defineCompositionRegistry,
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
  type CompositionCategory,
  type CompositionInstallPlan,
  type CompositionManifest,
  type CompositionManifestMap,
  type CompositionRegistryEntry,
  type CopySourceFile,
  type CopySourceFileRole,
  type CopySourceCompositionInstallPlan,
  type CopySourceInstallPlan,
  type CopySourceManifest,
  type CopySourceManifestMap,
  type InstallDependencyGroups,
  type PackageInstallPlan,
  type PackageCompositionInstallPlan,
  type RegistryDeliveryMode,
  type RegistryInstallPlan,
  type RegistryPackageManager,
} from "./schema.js";

export { compositionManifests } from "./composition-manifests.js";
export { getCompositionInstallPlan, getInstallCommand, getInstallPlan } from "./install-plan.js";
export { copySourceManifests } from "./manifests.js";
export type { ComponentSlug } from "./components.js";
export type { CompositionSlug } from "./compositions.js";
