# Changesets

Add a changeset whenever a pull request changes a public package API or behavior:

```bash
pnpm changeset
```

Select the affected packages, choose their semantic-version bumps, and describe the consumer-visible change. Documentation-only and internal tooling changes do not require a changeset.

Versioning and publication remain separate explicit operations:

```bash
pnpm release:check
pnpm release:version
pnpm release:publish
```

Do not run `release:publish` until npm trusted publishing is configured and the release commit has passed CI.