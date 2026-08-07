# ADR 0005: Separate Docs Hosting And Package Releases

- Status: Accepted
- Date: 2026-08-07

## Context

The documentation and playground need preview deployments, while public packages need reproducible validation, version review, short-lived npm credentials, and provenance. Coupling package availability to the docs host would make a library release depend on a vendor-specific runtime path.

Long-lived npm write tokens also create avoidable rotation and disclosure risk.

## Decision

Use separate delivery paths with GitHub as the shared source of truth.

For documentation:

- Build the Next.js application from the monorepo.
- Deploy production and pull-request previews to Vercel.
- Keep Vercel-specific behavior out of the public runtime packages.

For packages:

- Run formatting, lint, typecheck, tests, builds, the consumer fixture, and Publint in GitHub Actions.
- Use Changesets to create a reviewed Version Packages pull request.
- Publish only from `main` after the version pull request removes the pending changesets.
- Repeat the release checks before publication.
- Use npm CLI with GitHub OIDC Trusted Publishing; do not store a long-lived npm write token.
- Grant `id-token: write` only to the publish job.
- Publish in dependency order and skip versions already present on npm so retries are safe.
- Create package tags and GitHub releases only for successful publishes.

Each npm package must trust `Eswar2000/easecraft` and the exact workflow filename `release.yml` for the `npm publish` action. Trusted publication from this public repository supplies npm provenance automatically.

## Consequences

- A docs deployment failure does not change package runtime availability.
- Release commits are reviewed separately from the publish operation.
- Publication requires a GitHub-hosted runner and an OIDC-capable npm CLI.
- Package-side Trusted Publisher settings are an operational prerequisite outside the repository.
- Manual publication remains a documented fallback, but CI is the normal release authority.
- Vercel can be replaced without changing package APIs or npm authentication.

## Revisit When

Reconsider this architecture if npm staged publishing becomes the preferred approval model, if release volume requires artifact promotion between jobs, or if the documentation moves to a host with materially different build constraints.