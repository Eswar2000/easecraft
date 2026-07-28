import type { CopySourceFileRole, RegistryDeliveryMode } from "easecraft-registry";

export interface CompositionDeliverySourceFile {
  readonly content: string;
  readonly destinationPath: string;
  readonly role: CopySourceFileRole;
}

export type CompositionDeliverySources = Readonly<
  Record<RegistryDeliveryMode, readonly CompositionDeliverySourceFile[]>
>;

export function serializeCompositionSources(
  files: readonly CompositionDeliverySourceFile[],
): string {
  return files
    .map(
      (file) =>
        `// File: ${file.destinationPath}\n${file.content}${file.content.endsWith("\n") ? "" : "\n"}`,
    )
    .join("\n");
}
