const compositionModules = import.meta.glob<string>("../source/compositions/*.tsx", {
  eager: true,
  import: "default",
  query: "?raw",
});
const reactModules = import.meta.glob<string>(
  [
    "../../react/src/*.{ts,tsx}",
    "!../../react/src/*.test.{ts,tsx}",
    "!../../react/src/*.integration.test.{ts,tsx}",
  ],
  {
    eager: true,
    import: "default",
    query: "?raw",
  },
);

const sourceContentByPath = new Map<string, string>([
  ...Object.entries(compositionModules).map(
    ([modulePath, content]) =>
      [`packages/registry/${modulePath.slice("../".length)}`, content] as const,
  ),
  ...Object.entries(reactModules).map(
    ([modulePath, content]) => [`packages/${modulePath.slice("../../".length)}`, content] as const,
  ),
]);

export const registrySourcePaths = Object.freeze([...sourceContentByPath.keys()].sort());

export function getRegistrySourceContent(sourcePath: string): string {
  const content = sourceContentByPath.get(sourcePath);

  if (content === undefined) {
    throw new Error(`Unknown Easecraft source path: ${sourcePath}`);
  }

  return content;
}
