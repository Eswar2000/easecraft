# ADR 0003: Keep Runtime Styling Consumer-Owned

- Status: Accepted
- Date: 2026-08-07

## Context

Easecraft must work inside applications with different CSS frameworks, naming conventions, themes, and cascade strategies. A required global stylesheet would add ordering concerns, visual opinions, and side effects to a package whose primary contract is motion and accessible behavior.

Some layout rules are nevertheless required for correct behavior, including dialog positioning, toast viewports, visual hiding, and intrinsic layout used during animation.

## Decision

The `easecraft` runtime package does not ship or import a global component stylesheet.

Runtime components expose styling through:

- `className` props for roots and meaningful internal slots.
- `style` props where consumers need direct control.
- Stable `data-easecraft-*` attributes for CSS selectors and observable state.
- CSS custom properties for compact overrides of structural defaults.

Inline defaults are limited to behavior-critical structure and accessible fallbacks. Consumer-provided style values are merged after defaults where the component API permits overrides. Brand, typography, color, surface, and decorative styling belong to the consuming application.

The docs application and registry compositions may be visually opinionated, but those styles are not a runtime dependency of `easecraft`. Motion timing belongs to `easecraft-tokens`, not to the visual theme layer.

## Consequences

- Consumers do not need a mandatory CSS import or a specific styling framework.
- The runtime package remains side-effect free and tree-shakable.
- Components are functional and accessible by default but intentionally not a complete visual design system.
- Slot-level class props make some component APIs larger.
- Behavior-critical inline declarations can require explicit style props or documented CSS variables to override.

## Revisit When

Reconsider this strategy if repeated consumer feedback demonstrates that a separate optional stylesheet or theme package would remove substantial integration work without becoming a required runtime side effect.