import {
  getCompositionInstallPlan,
  type CompositionSlug,
  type CopySourceFile,
  type RegistryDeliveryMode,
} from "easecraft-registry";
import { getRegistrySourceContent } from "easecraft-registry/source-content";

import type {
  CompositionDeliverySourceFile,
  CompositionDeliverySources,
} from "./composition-delivery-types";

export function readCompositionSourceFile(file: CopySourceFile): CompositionDeliverySourceFile {
  return {
    content: getRegistrySourceContent(file.sourcePath),
    destinationPath: file.destinationPath,
    role: file.role,
  };
}

function readModeSources(slug: CompositionSlug, mode: RegistryDeliveryMode) {
  const plan = getCompositionInstallPlan(slug, mode);
  return plan.files.map(readCompositionSourceFile);
}

export function getCompositionDeliverySources(
  slug: CompositionSlug,
): Promise<CompositionDeliverySources> {
  const packageSources = readModeSources(slug, "package");
  const copySources = readModeSources(slug, "copy-source");

  return Promise.resolve({
    package: packageSources,
    "copy-source": copySources,
  });
}
