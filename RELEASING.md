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

## Manual Publication

Use this fallback only when automated publishing is unavailable. From a clean, up-to-date `main` checkout after merging the version pull request:

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

Complete npm authentication and two-factor prompts directly in the terminal. The publisher skips versions that already exist, then publishes `easecraft-tokens`, `easecraft`, and `easecraft-registry` in dependency order. Preview its plan without publishing:

```bash
pnpm release:publish:dry-run
```

Verify the package versions afterward:

```bash
npm view easecraft-tokens version
npm view easecraft version
npm view easecraft-registry version
```

After every intended version is visible on npm, create and push the annotated package tags:

```bash
pnpm changeset tag
git push origin --follow-tags
```

The manual fallback does not create GitHub Releases. Create any required releases from the matching changelog entries after the tags are pushed.

## Trusted Publishing

Configure the same GitHub Actions trusted publisher on `easecraft-tokens`, `easecraft`, and `easecraft-registry`:

- GitHub owner: `Eswar2000`
- Repository: `easecraft`
- Workflow filename: `release.yml`
- Allowed action: `npm publish`

The filename is case-sensitive and must not include `.github/workflows/`. Do not add an npm write token.

The Release workflow separates versioning from publishing so only the publish job receives `id-token: write`. After the version pull request is merged, that job:

1. Runs formatting, lint, type, test, build, Publint, and package checks.
2. Uses npm CLI `11.6.2` to publish only versions that are not already on npm.
3. Creates a package tag and GitHub release after each successful publish.
4. Relies on npm Trusted Publishing to attach provenance automatically.

After one OIDC release succeeds for all three packages, set each package's npm publishing access to **Require two-factor authentication and disallow tokens**, then revoke any obsolete automation tokens.