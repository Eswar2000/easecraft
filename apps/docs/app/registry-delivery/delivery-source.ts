import {
  getCompositionInstallPlan,
  getInstallPlan,
  type ComponentSlug,
  type CompositionSlug,
  type CopySourceFile,
} from "easecraft-registry";
import { getRegistrySourceContent } from "easecraft-registry/source-content";

import type { RegistryDeliverySourceFile, RegistryDeliverySources } from "./delivery-types";

export function readRegistrySourceFile(file: CopySourceFile): RegistryDeliverySourceFile {
  return {
    content: getRegistrySourceContent(file.sourcePath),
    destinationPath: file.destinationPath,
    role: file.role,
  };
}

function materialize(files: readonly CopySourceFile[]): readonly RegistryDeliverySourceFile[] {
  return files.map(readRegistrySourceFile);
}

export function getComponentDeliverySources(slug: ComponentSlug): RegistryDeliverySources {
  return {
    package: materialize(getInstallPlan(slug, "package").files),
    "copy-source": materialize(getInstallPlan(slug, "copy-source").files),
  };
}

export function getCompositionDeliverySources(slug: CompositionSlug): RegistryDeliverySources {
  return {
    package: materialize(getCompositionInstallPlan(slug, "package").files),
    "copy-source": materialize(getCompositionInstallPlan(slug, "copy-source").files),
  };
}
