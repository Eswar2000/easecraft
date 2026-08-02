# easecraft-tokens

Framework-independent semantic motion tokens for Easecraft.

## Install

```bash
pnpm add easecraft-tokens
```

## Usage

```ts
import { defaultMotionTokens, resolveMotionTokens } from "easecraft-tokens";

const tokens = resolveMotionTokens({
  duration: { normal: 360 },
  easing: { enter: "out(4)" },
});

console.log(defaultMotionTokens.distance.medium, tokens.duration.normal);
```

The package has no React dependency. It exports typed duration, distance, stagger, and easing tokens plus partial override resolution.

[Documentation](https://easecraft-docs.vercel.app) | [Source](https://github.com/Eswar2000/easecraft/tree/main/packages/tokens)

## License

MIT