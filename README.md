# Easecraft

> Accessible motion primitives and animated React components, powered by Anime.js.

Easecraft is an open-source motion design system planned for React. It will combine typed motion primitives, accessible animated components, a copyable component registry, and an interactive playground for inspecting and tuning motion.

## Project Status

Easecraft is currently in the **repository-foundation stage**. The framework-independent token package, Next.js component explorer, and Vite consumer fixture are implemented and buildable; the React motion package has not been implemented or published yet.

The complete product scope, architecture, delivery plan, and initial backlog are documented in the [project proposal](PROPOSAL.md).

## Planned npm Packages

Easecraft will use unscoped npm package names.

| Package | Purpose |
| --- | --- |
| `easecraft` | React motion primitives, hooks, and components |
| `easecraft-tokens` | Framework-independent motion tokens |
| `easecraft-registry` | Typed metadata and copyable component source |
| `easecraft-cli` | Post-MVP registry CLI |

These names were unregistered on npm when checked on 2026-07-25. They are planned identifiers, not reserved names, until their first publication.

`easecraft-tokens` is the first implemented package. The Vite fixture consumes its workspace export as an external application would; all packages remain private and unpublished during foundation work.

## Development

The workspace currently requires Node.js 24 or newer and Corepack. Install dependencies and run the repository checks from the root:

```bash
corepack enable
pnpm install
pnpm dev
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` starts the token build watcher, docs explorer, and Vite consumer fixture and prints the application URLs. `pnpm lint` runs shared type-aware ESLint rules, including React Hooks and JSX accessibility checks where applicable. `pnpm typecheck` runs TypeScript 6 with shared strict settings, and `pnpm format:check` validates code and configuration files with Prettier. `pnpm build` builds both applications and `easecraft-tokens`; the React and registry builds remain placeholders. `pnpm test` runs the token tests while remaining workspace tests are placeholders.

## What Easecraft Will Provide

- A small React package of motion primitives, hooks, and accessible animated components
- Shared tokens for duration, easing, distance, and stagger
- Built-in `prefers-reduced-motion` behavior and application-level overrides
- A browsable registry with live previews and copyable source
- A playground with validated controls and generated React examples
- Lifecycle, accessibility, cross-browser, and consumer integration tests

## Planned Version 1

The proposed first release includes five foundations, five hooks, and eight high-level components:

- Foundations: `MotionProvider`, `Motion`, `Presence`, `Stagger`, and `Timeline`
- Hooks: `useAnime`, `useTimeline`, `usePresence`, `useReducedMotion`, and `useScrollProgress`
- Components: `TextReveal`, `NumberTicker`, `StaggeredList`, `AnimatedTabs`, `MotionDialog`, `ToastStack`, `FilterGrid`, and `ScrollReveal`

`TextReveal` is planned as the first vertical slice to prove the package API, Anime.js lifecycle integration, reduced-motion behavior, documentation, tests, and consumer build before the catalog expands.

## Principles

- Motion should communicate state, hierarchy, causality, or progress.
- Accessible behavior is part of each component's contract.
- React lifecycle integration and cleanup should be centralized and tested.
- Stable package APIs and visually opinionated registry examples should evolve independently.
- One complete, credible component is more valuable than a broad set of shallow effects.

## Roadmap

| Phase | Focus |
| --- | --- |
| 0 | Repository, workspace, tooling, docs shell, CI, and architecture decisions |
| 1 | Tokens, provider, core hooks, motion primitives, and lifecycle tests |
| 2 | First components and their complete documentation |
| 3 | Interactive components and registry compositions |
| 4 | Typed registry, playground, code generation, persistence, and share URLs |
| 5 | Accessibility and performance reports, automated releases, and public launch |

See the [delivery plan](PROPOSAL.md#24-delivery-plan) for deliverables and exit criteria.

## Contributing

Project feedback, accessibility research, API discussion, documentation improvements, and implementation contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Please report security concerns according to the [Security Policy](SECURITY.md).

## License

Easecraft is licensed under the [MIT License](LICENSE).