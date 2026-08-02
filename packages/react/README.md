# easecraft

Accessible React motion primitives and animated components powered by Anime.js.

## Install

```bash
pnpm add easecraft
```

Easecraft supports React and React DOM 18.2 through 19.

## Usage

```tsx
import { MotionProvider, TextReveal } from "easecraft";

export function Example() {
  return (
    <MotionProvider reducedMotion="system">
      <TextReveal preset="fade-rise" split="words">
        Motion should explain what changed.
      </TextReveal>
    </MotionProvider>
  );
}
```

Every component includes reduced-motion behavior and keeps its semantic content available before animation enhancement.

[Documentation](https://easecraft-docs.vercel.app) | [Components](https://easecraft-docs.vercel.app/components/text-reveal) | [Source](https://github.com/Eswar2000/easecraft/tree/main/packages/react)

## License

MIT