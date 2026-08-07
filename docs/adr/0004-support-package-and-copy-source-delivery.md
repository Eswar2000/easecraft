# ADR 0004: Support Package And Copy-Source Delivery

- Status: Accepted
- Date: 2026-08-07

## Context

Some teams want maintained package APIs and centralized upgrades. Others need to own and adapt component source inside their application. Maintaining separate prose instructions for those paths would allow dependencies, files, and install commands to drift apart.

Compositions also need to work with either imported Easecraft components or copied component implementations.

## Decision

Model `package` and `copy-source` as explicit, typed registry delivery modes.

The registry is the canonical source for:

- Component and composition metadata.
- External, peer, and workspace dependency declarations.
- Source and destination file mappings.
- Registry-to-registry dependencies.
- Package-manager install commands.

Package plans install the released `easecraft` version and do not copy primitive source. Package-backed compositions include only their composition wrapper files. Copy-source plans recursively resolve component dependencies, deduplicate files by destination, reject destination collisions, and include the external dependencies required by the copied implementation.

Manifest construction validates slugs and safe relative paths. Documentation and playground delivery actions derive commands and file lists from install plans rather than duplicating them in prose.

Both delivery modes must compile in tests. The published `easecraft-registry` package contains typed metadata, composition entry points, copyable source, and a source-content export.

## Consequences

- Package and copy-source instructions stay synchronized with release metadata.
- Copy-source consumers own later modifications and do not receive automatic implementation updates.
- Registry changes can affect generated commands and copied file graphs, so they require focused manifest and compile tests.
- Shipping source content makes the registry package larger than a metadata-only catalog.
- A future CLI can consume the same install-plan contract instead of inventing a second dependency resolver.

## Revisit When

Reconsider the distribution shape when the planned CLI is implemented, especially if remote registry transport or partial source downloads make embedding all source content in the npm package unnecessary.