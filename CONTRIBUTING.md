# Contributing to Easecraft

Thank you for helping improve Easecraft. Contributions can include proposal feedback, accessibility research, API design, documentation, tests, examples, and implementation work.

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Current Stage

Easecraft is in the repository-foundation stage. The pnpm and Turborepo workspace is initialized, while package source and applications remain to be implemented.

The immediate focus is Phase 0 of the [project proposal](PROPOSAL.md#phase-0-product-and-repository-foundation): confirming the remaining public identifiers, establishing shared quality checks, and proving a local package can be consumed by an example application.

Useful contributions at this stage include:

- Finding unclear requirements or conflicting decisions in the proposal
- Improving accessibility, reduced-motion, and keyboard interaction requirements
- Reviewing package boundaries and public API assumptions
- Refining acceptance criteria and identifying missing tests
- Improving repository documentation

## Before You Start

1. Search existing issues and pull requests to avoid duplicate work.
2. Open an issue for a significant feature, architecture change, or public API decision before implementing it.
3. Small documentation corrections can go directly to a pull request.
4. Never include credentials, tokens, private data, or generated secrets.

Security vulnerabilities should not be reported in a public issue. Follow [SECURITY.md](SECURITY.md) instead.

## Local Workflow

Clone the personal-account repository and create a focused branch:

```bash
git clone https://github.com/Eswar2000/easecraft.git
cd easecraft
corepack enable
pnpm install
git switch -c docs/short-description
```

Development currently requires Node.js 24 or newer. Run the available repository checks from the root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm typecheck` runs the real shared strict TypeScript configuration. The lint, test, and build commands currently execute placeholders to verify workspace discovery and orchestration until their toolchains are configured.

## Making Changes

- Keep each pull request focused on one concern.
- Follow the existing style and avoid unrelated formatting changes.
- Update documentation when behavior, setup, or public APIs change.
- Add tests for observable behavior when implementation code is introduced.
- Include reduced-motion and keyboard behavior in changes involving interaction.
- Prefer semantic component APIs over exposing animation-engine internals.
- Do not commit build output unless the repository explicitly begins tracking it.

Use clear, imperative commit subjects, for example:

```text
Document reduced-motion behavior for TextReveal
```

## Pull Requests

A pull request should include:

- A short explanation of the problem and the chosen solution
- A linked issue when one exists
- The checks you ran and their results
- Screenshots or recordings for visible behavior once a UI exists
- Accessibility and reduced-motion notes for interactive changes
- Any follow-up work intentionally left out of scope

Draft pull requests are welcome for early feedback. A pull request is ready for review when its relevant checks pass and its documentation is complete.

## Licensing

By contributing, you agree that your contributions will be licensed under the repository's [MIT License](LICENSE).