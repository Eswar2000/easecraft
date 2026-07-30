import type { CopySourceFileRole, RegistryDeliveryMode } from "easecraft-registry";

export interface RegistryDeliverySourceFile {
  readonly content: string;
  readonly destinationPath: string;
  readonly role: CopySourceFileRole;
}

export type RegistryDeliverySources = Readonly<
  Record<RegistryDeliveryMode, readonly RegistryDeliverySourceFile[]>
>;

export function serializeRegistrySources(files: readonly RegistryDeliverySourceFile[]): string {
  return files
    .map(
      (file) =>
        `// File: ${file.destinationPath}\n${file.content}${file.content.endsWith("\n") ? "" : "\n"}`,
    )
    .join("\n");
}
