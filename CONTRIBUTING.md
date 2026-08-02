# Contributing to Easecraft

Thank you for helping improve Easecraft. Contributions can include proposal feedback, accessibility research, API design, documentation, tests, examples, and implementation work.

## Code of Conduct

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Current Stage

Easecraft has completed its core motion foundation, including `Stagger`, all nine planned component vertical slices, the typed registry, all eight planned compositions, component/composition copy actions, and playground controls, package, copy-source, and token-override code templates, local persistence, and versioned share URLs for all nine components.

The initial playground milestone, continuous integration, Vercel deployment, and `0.1.0` package release preparation are complete. The immediate focus is the one-time npm publication and trusted-publisher handoff, followed by architecture decision records and remaining identity checks.

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
pnpm dev
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` starts token, React, and registry package build watchers plus both applications. The format, lint, and typecheck commands run real Prettier, ESLint, and strict TypeScript checks. The build command produces both applications and all three implementation packages. The test command runs token, React, registry, and docs tests; the Vite consumer currently has a placeholder test task. Pull requests and pushes to `main` run these checks in GitHub Actions after a frozen lockfile install.

## Making Changes

- Keep each pull request focused on one concern.
- Follow the existing style and avoid unrelated formatting changes.
- Update documentation when behavior, setup, or public APIs change.
- Add tests for observable behavior when implementation code is introduced.
- Add a changeset with `pnpm changeset` for consumer-visible package changes.
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

Maintainers should follow [RELEASING.md](RELEASING.md) for package versioning and publication.

## Licensing

By contributing, you agree that your contributions will be licensed under the repository's [MIT License](LICENSE).