import { componentEntries, type ComponentSlug } from "./components.js";
import {
  defineCopySourceManifests,
  type CopySourceFile,
  type CopySourceManifestMap,
} from "./schema.js";

const destinationRoot = "components/easecraft";
const sourceRoot = "packages/react/src";

function sourceFile(
  name: string,
  extension: "ts" | "tsx",
  role: CopySourceFile["role"],
): CopySourceFile {
  return {
    destinationPath: `${destinationRoot}/${name}.${extension}`,
    role,
    sourcePath: `${sourceRoot}/${name}.${extension}`,
  };
}

const motionProvider = sourceFile("motion-provider", "tsx", "provider");
const useAnime = sourceFile("use-anime", "ts", "hook");
const stagger = sourceFile("stagger", "tsx", "utility");

function componentFile(slug: ComponentSlug): CopySourceFile {
  return sourceFile(slug, "tsx", "component");
}

function withMotionProvider(slug: ComponentSlug): readonly CopySourceFile[] {
  return [motionProvider, componentFile(slug)];
}

function withUseAnime(slug: ComponentSlug): readonly CopySourceFile[] {
  return [motionProvider, useAnime, componentFile(slug)];
}

function withStaggerFoundation(slug: ComponentSlug): readonly CopySourceFile[] {
  return [motionProvider, useAnime, stagger, componentFile(slug)];
}

const componentSlugs = componentEntries.map((component) => component.slug);

export const copySourceManifests = defineCopySourceManifests(componentSlugs, {
  "animated-accordion": {
    files: withMotionProvider("animated-accordion"),
    registryDependencies: [],
    slug: "animated-accordion",
  },
  "animated-tabs": {
    files: withMotionProvider("animated-tabs"),
    registryDependencies: [],
    slug: "animated-tabs",
  },
  "filter-grid": {
    files: [componentFile("filter-grid")],
    registryDependencies: ["staggered-list"],
    slug: "filter-grid",
  },
  "motion-dialog": {
    files: withMotionProvider("motion-dialog"),
    registryDependencies: [],
    slug: "motion-dialog",
  },
  "number-ticker": {
    files: withUseAnime("number-ticker"),
    registryDependencies: [],
    slug: "number-ticker",
  },
  "scroll-reveal": {
    files: withMotionProvider("scroll-reveal"),
    registryDependencies: [],
    slug: "scroll-reveal",
  },
  "staggered-list": {
    files: withStaggerFoundation("staggered-list"),
    registryDependencies: [],
    slug: "staggered-list",
  },
  "text-reveal": {
    files: withUseAnime("text-reveal"),
    registryDependencies: [],
    slug: "text-reveal",
  },
  "toast-stack": {
    files: withMotionProvider("toast-stack"),
    registryDependencies: [],
    slug: "toast-stack",
  },
} satisfies CopySourceManifestMap<ComponentSlug>);
