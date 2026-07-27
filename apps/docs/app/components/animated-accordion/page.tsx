import type { Metadata } from "next";

import { AnimatedAccordionDemo } from "./animated-accordion-demo";

export const metadata: Metadata = {
  title: "Animated Accordion | Easecraft",
  description: "Accessible intrinsic-height accordion transitions with retained panel exits.",
};

const usageCode = `import { AnimatedAccordion } from "easecraft";

<AnimatedAccordion
  aria-label="Project details"
  items={details}
  getValue={(detail) => detail.id}
  getLabel={(detail) => detail.label}
  defaultValue="overview"
>
  {(detail) => <ProjectDetail detail={detail} />}
</AnimatedAccordion>`;

const apiRows = [
  ["items", "readonly Item[]", "required", "Accordion item data"],
  ["getValue", "(item) => string", "required", "Stable item value"],
  ["getLabel", "(item) => ReactNode", "required", "Trigger label renderer"],
  ["children", "(item) => ReactNode", "required", "Panel renderer"],
  ["mode", '"single" | "multiple"', '"single"', "Expansion model"],
  ["value", "string | readonly string[]", "uncontrolled", "Controlled expanded values"],
  ["defaultValue", "string | readonly string[]", "none", "Initial expanded values"],
  ["onValueChange", "mode-dependent callback", "none", "Expansion change callback"],
  ["collapsible", "boolean", "true", "Allow all single panels to close"],
  ["disabled", "boolean", "false", "Disable the full accordion"],
  ["isDisabled", "(item) => boolean", "none", "Disable individual items"],
  ["headingLevel", "2 | 3 | 4 | 5 | 6", "3", "Semantic trigger heading"],
  ["duration", "duration token | number", '"normal"', "Opening duration"],
  ["easing", "easing token | string", '"enter"', "Opening easing"],
  ["exitDuration", "duration token | number", '"fast"', "Closing duration"],
  ["exitEasing", "easing token | string", '"exit"', "Closing easing"],
  ["as", "HTML tag", '"div"', "Polymorphic host element"],
] as const;

export default function AnimatedAccordionPage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Easecraft component explorer">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>Easecraft</span>
        </a>
        <nav aria-label="Component navigation">
          <a href="/#components">Components</a>
          <a href="#api">API</a>
          <a href="#accessibility">Accessibility</a>
        </nav>
        <span className="release-status">Implemented</span>
      </header>

      <main className="component-detail-main">
        <section className="component-detail-heading" aria-labelledby="component-title">
          <div>
            <p className="eyebrow">Component / Layout</p>
            <h1 id="component-title">Animated Accordion</h1>
          </div>
          <p>
            Reveal variable-height detail with stable trigger and region semantics, retained closing
            content, interruption-safe transitions, and complete keyboard navigation.
          </p>
        </section>

        <AnimatedAccordionDemo />

        <section className="component-doc-band usage-band" aria-labelledby="usage-title">
          <div>
            <p className="eyebrow">Package usage</p>
            <h2 id="usage-title">Use it</h2>
          </div>
          <pre>
            <code>{usageCode}</code>
          </pre>
        </section>

        <section className="component-doc-band" id="api" aria-labelledby="api-title">
          <div>
            <p className="eyebrow">Typed contract</p>
            <h2 id="api-title">API</h2>
          </div>
          <div className="api-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Prop</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                  <th scope="col">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {apiRows.map(([prop, type, defaultValue, purpose]) => (
                  <tr key={prop}>
                    <th scope="row">{prop}</th>
                    <td>{type}</td>
                    <td>{defaultValue}</td>
                    <td>{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          className="component-doc-band accessibility-band"
          id="accessibility"
          aria-labelledby="accessibility-title"
        >
          <div>
            <p className="eyebrow">Release requirement</p>
            <h2 id="accessibility-title">Accessibility</h2>
          </div>
          <dl>
            <div>
              <dt>Semantic linkage</dt>
              <dd>Every heading trigger controls one persistently identified, labelled region.</dd>
            </div>
            <div>
              <dt>Keyboard</dt>
              <dd>Arrow keys, Home, End, Enter, and Space follow the accordion APG pattern.</dd>
            </div>
            <div>
              <dt>Retained exit</dt>
              <dd>
                Closing content becomes inert and hidden from assistive technology before exit.
              </dd>
            </div>
            <div>
              <dt>Focus safety</dt>
              <dd>Programmatic closure moves focus from panel content back to its trigger.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>
                Expanded state and semantics settle immediately without creating an animation.
              </dd>
            </div>
            <div>
              <dt>Server rendering</dt>
              <dd>Default expanded content and closed panel semantics render deterministically.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
