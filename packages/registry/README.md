# easecraft-registry

Typed Easecraft component metadata, deterministic installation plans, copy-source manifests, and composition exports.

## Install

```bash
pnpm add easecraft-registry easecraft
```

## Registry metadata

```ts
import { getInstallPlan, listComponents } from "easecraft-registry";

const components = listComponents();
const plan = getInstallPlan("text-reveal", "copy-source");
```

## Composition export

```tsx
import { CommandPalette } from "easecraft-registry/compositions/command-palette";
```

Composition exports use `easecraft`, React, and React DOM as peer dependencies. Pre-1.0 registry releases support the coordinated pre-1.0 Easecraft line. Copy-source plans expose the files and external dependencies needed to own the implementation locally.

[Documentation](https://easecraft-docs.vercel.app/compositions) | [Source](https://github.com/Eswar2000/easecraft/tree/main/packages/registry)

## License

MIT