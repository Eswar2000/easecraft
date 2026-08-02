# Releasing Easecraft

Easecraft uses Changesets to coordinate versions and changelogs for `easecraft-tokens`, `easecraft`, and `easecraft-registry`.

## Package Changes

Add a changeset for every consumer-visible package change:

```bash
pnpm changeset
```

CI validates package manifests with Publint. Before a release, run:

```bash
pnpm release:check
```

This builds the workspace, validates all three manifests, and prints each package tarball without publishing it.

## Version Pull Request

Pushes to `main` run the Release workflow. When changesets are present, it creates or updates a `chore: version packages` pull request containing package versions and changelogs.

Repository settings must allow GitHub Actions to create pull requests:

1. Open **Settings → Actions → General**.
2. Under **Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**.

Review and merge the version pull request only after CI and deployment checks pass.

## Initial npm Publication

The first release must claim the unscoped npm package names before trusted publishers can be configured. From a clean, up-to-date `main` checkout after merging the version pull request:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm release:check
npm login
pnpm release:publish
```

Complete npm authentication and two-factor prompts directly in the terminal. Verify all three `0.1.0` packages afterward:

```bash
npm view easecraft-tokens version
npm view easecraft version
npm view easecraft-registry version
```

## Trusted Publishing

After the first release, configure the same GitHub Actions trusted publisher on each npm package:

- GitHub owner: `Eswar2000`
- Repository: `easecraft`
- Workflow filename: `release.yml`
- Allowed action: `npm publish`

Then add OIDC publishing to the Release workflow with `id-token: write`. Do not add a long-lived npm write token. Trusted publishing automatically adds provenance for this public repository.