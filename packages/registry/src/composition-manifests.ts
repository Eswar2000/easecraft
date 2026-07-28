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
} satisfies CompositionManifestMap<CompositionSlug, ComponentSlug>);
