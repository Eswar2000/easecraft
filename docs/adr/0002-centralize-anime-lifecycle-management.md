# ADR 0002: Centralize Anime.js Lifecycle Management

- Status: Accepted
- Date: 2026-08-07

## Context

Anime.js mutates DOM styles and owns animation instances outside React's state model. Creating animations during render, selecting outside a component root, or omitting cleanup can produce hydration differences, stale inline styles, duplicate development-mode effects, and work that continues after unmount.

Every animated component also needs the same motion-token and reduced-motion context.

## Decision

Use `useAnime` as the primary React-to-Anime.js integration boundary.

The hook must:

- Create animations only in an effect after its root element exists.
- Create one Anime.js scope rooted at the element returned by the hook.
- Give setup code scoped animation APIs, resolved motion tokens, and the current reduced-motion decision.
- Recreate the scope when setup, tokens, or reduced-motion configuration changes.
- Call `scope.revert()` during cleanup so animation instances and mutated styles are released together.

Components may implement state machines for interruption, presence, focus, and completion behavior, but they must not duplicate global selector or lifecycle setup. Public component APIs do not expose internal Anime.js instances unless a future imperative contract explicitly requires one.

Server output must remain deterministic. Motion enhancement starts on the client, and reduced-motion branches must preserve the semantic end state without requiring an animation to run.

## Consequences

- React Strict Mode mount and cleanup cycles exercise the same supported path as production unmounts.
- Selectors and mutations stay within a component root.
- Token or reduced-motion changes intentionally rebuild the affected animation scope.
- Setup callbacks are effect dependencies and must be stabilized by component implementations where repeated setup is not intended.
- Advanced consumers use Easecraft's hooks and primitives rather than reaching into component-owned Anime.js instances.

## Revisit When

Reconsider the boundary if Anime.js replaces scoped cleanup with a different lifecycle primitive, or if React introduces an effect model that changes how external animation systems should subscribe and clean up.