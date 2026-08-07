# ADR 0001: Separate Public Package Boundaries

- Status: Accepted
- Date: 2026-08-07

## Context

Easecraft serves three different ownership models: framework-independent motion values, React runtime behavior, and registry metadata plus copyable source. Shipping all three from one package would couple consumers to React and registry payloads they may not need. It would also allow documentation concerns to leak into the runtime API.

The monorepo additionally contains private applications and shared tooling that should never become public runtime dependencies.

## Decision

Maintain these public packages and dependency directions:

- `easecraft-tokens` owns typed durations, easing values, distances, stagger values, defaults, and override resolution. It has no React dependency.
- `easecraft` owns React providers, hooks, primitives, accessible components, and Anime.js integration. It depends on `easecraft-tokens`, keeps React and React DOM as peers, and owns the runtime Anime.js and Radix dependencies it invokes.
- `easecraft-registry` owns typed catalog metadata, validated install plans, copy-source manifests, source content, and composition entry points. Its executable compositions consume `easecraft` and React as peers.

The dependency direction is:

```text
easecraft-registry -> easecraft -> easecraft-tokens
```

Reverse dependencies and circular package references are not allowed. The docs application, Vite consumer, ESLint configuration, and TypeScript configuration remain private workspace packages.

## Consequences

- Token consumers do not install React or Anime.js.
- Runtime consumers do not receive registry source payloads through the `easecraft` root export.
- Registry releases must remain compatible with the supported pre-1.0 `easecraft` line.
- Cross-package changes may require coordinated Changesets entries and version updates.
- A future adapter for another UI framework can depend on `easecraft-tokens` without depending on the React package.

## Revisit When

Reconsider this boundary if a second runtime adapter exposes shared behavior that cannot live in `easecraft-tokens`, or if registry consumers require a smaller metadata-only package with materially different release cadence.