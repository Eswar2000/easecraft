# Architecture Decision Records

Architecture decision records (ADRs) capture implementation constraints that affect more than one feature or package. They explain why the current design exists, what it costs, and when it should be reconsidered.

## Decisions

| ID | Decision | Status |
| --- | --- | --- |
| [0001](0001-separate-public-package-boundaries.md) | Separate public package boundaries | Accepted |
| [0002](0002-centralize-anime-lifecycle-management.md) | Centralize Anime.js lifecycle management | Accepted |
| [0003](0003-keep-runtime-styling-consumer-owned.md) | Keep runtime styling consumer-owned | Accepted |
| [0004](0004-support-package-and-copy-source-delivery.md) | Support package and copy-source delivery | Accepted |
| [0005](0005-separate-docs-hosting-and-package-releases.md) | Separate docs hosting and package releases | Accepted |

## Lifecycle

- **Proposed:** Under discussion and not yet binding.
- **Accepted:** The repository should conform to the decision.
- **Superseded:** Replaced by a newer ADR that links back to the original.
- **Deprecated:** Retained for context but no longer recommended.

When an accepted decision must change, add a new ADR that supersedes it. Do not rewrite the original rationale except to correct factual or formatting errors.