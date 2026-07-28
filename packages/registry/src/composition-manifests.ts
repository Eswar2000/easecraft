import { componentEntries, type ComponentSlug } from "./components.js";
import { compositionEntries, type CompositionSlug } from "./compositions.js";
import {
  defineCompositionManifests,
  type CompositionManifestMap,
  type CopySourceFile,
} from "./schema.js";

const destinationRoot = "components/easecraft/compositions";
const sourceRoot = "packages/registry/source/compositions";

function compositionFile(sourceName: string, destinationName: string): CopySourceFile {
  return {
    destinationPath: `${destinationRoot}/${destinationName}.tsx`,
    role: "composition",
    sourcePath: `${sourceRoot}/${sourceName}.tsx`,
  };
}

function supportFile(name: string): CopySourceFile {
  return {
    destinationPath: `${destinationRoot}/${name}.tsx`,
    role: "utility",
    sourcePath: `${sourceRoot}/${name}.tsx`,
  };
}

const componentSlugs = componentEntries.map((component) => component.slug);
const compositionSlugs = compositionEntries.map((composition) => composition.slug);
const commandPaletteCore = supportFile("command-palette-core");
const expandableProjectCardCore = supportFile("expandable-project-card-core");
const filterableWorkGalleryCore = supportFile("filterable-work-gallery-core");
const notificationCenterCore = supportFile("notification-center-core");

export const compositionManifests = defineCompositionManifests(compositionSlugs, componentSlugs, {
  "command-palette": {
    componentDependencies: ["motion-dialog"],
    copySourceFiles: [
      commandPaletteCore,
      compositionFile("command-palette.copy", "command-palette"),
    ],
    packageFiles: [
      commandPaletteCore,
      compositionFile("command-palette.package", "command-palette"),
    ],
    slug: "command-palette",
  },
  "expandable-project-card": {
    componentDependencies: ["animated-accordion"],
    copySourceFiles: [
      expandableProjectCardCore,
      compositionFile("expandable-project-card.copy", "expandable-project-card"),
    ],
    packageFiles: [
      expandableProjectCardCore,
      compositionFile("expandable-project-card.package", "expandable-project-card"),
    ],
    slug: "expandable-project-card",
  },
  "filterable-work-gallery": {
    componentDependencies: ["filter-grid"],
    copySourceFiles: [
      filterableWorkGalleryCore,
      compositionFile("filterable-work-gallery.copy", "filterable-work-gallery"),
    ],
    packageFiles: [
      filterableWorkGalleryCore,
      compositionFile("filterable-work-gallery.package", "filterable-work-gallery"),
    ],
    slug: "filterable-work-gallery",
  },
  "notification-center": {
    componentDependencies: ["toast-stack"],
    copySourceFiles: [
      notificationCenterCore,
      compositionFile("notification-center.copy", "notification-center"),
    ],
    packageFiles: [
      notificationCenterCore,
      compositionFile("notification-center.package", "notification-center"),
    ],
    slug: "notification-center",
  },
} satisfies CompositionManifestMap<CompositionSlug, ComponentSlug>);
