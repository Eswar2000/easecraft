import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { AnimatedTabsDemo } from "./animated-tabs-demo";

export const metadata: Metadata = {
  title: "Animated Tabs | Easecraft",
  description: "Accessible keyboard-ready tabs with animated indicators and panels for React.",
};

const usageCode = `import { AnimatedTabs } from "easecraft";

<AnimatedTabs
  items={views}
  getValue={(view) => view.id}
  getLabel={(view) => view.label}
  aria-label="Workspace views"
>
  {(view) => <ViewPanel view={view} />}
</AnimatedTabs>`;

const apiRows = [
  ["items", "readonly Item[]", "required", "Tab and panel data"],
  ["getValue", "(item) => string", "required", "Stable tab value"],
  ["getLabel", "(item) => ReactNode", "required", "Tab label renderer"],
  ["children", "(item) => ReactNode", "required", "Selected panel renderer"],
  ["value", "string", "uncontrolled", "Controlled selected value"],
  ["defaultValue", "string", "first enabled", "Initial uncontrolled value"],
  ["onValueChange", "(value) => void", "none", "Selection callback"],
  ["activationMode", '"automatic" | "manual"', '"automatic"', "Keyboard activation"],
  ["orientation", '"horizontal" | "vertical"', '"horizontal"', "ARIA and arrow direction"],
  ["loop", "boolean", "true", "Wrap arrow navigation"],
  ["isDisabled", "(item) => boolean", "none", "Disable individual tabs"],
  ["duration", "duration token | number", '"normal"', "Indicator and panel duration"],
  ["distance", "distance token | number", '"small"', "Panel travel distance"],
  ["easing", "easing token | string", '"move"', "Indicator easing"],
  ["panelEasing", "easing token | string", '"enter"', "Panel easing"],
  ["as", "HTML tag", '"div"', "Polymorphic host element"],
] as const;

export default function AnimatedTabsPage() {
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
          <a href="#delivery">Delivery</a>
          <a href="#api">API</a>
          <a href="#accessibility">Accessibility</a>
        </nav>
        <span className="release-status">Implemented</span>
      </header>

      <main className="component-detail-main">
        <section className="component-detail-heading" aria-labelledby="component-title">
          <div>
            <p className="eyebrow">Component / Layout</p>
            <h1 id="component-title">Animated Tabs</h1>
          </div>
          <p>
            Navigate linked views with complete tab semantics, roving focus, automatic or manual
            activation, and a measured indicator that follows selection without obscuring focus.
          </p>
        </section>

        <AnimatedTabsDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="animated-tabs" />
        </div>

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
              <dd>Each tab controls and labels one stable tab panel through generated IDs.</dd>
            </div>
            <div>
              <dt>Keyboard</dt>
              <dd>Arrow keys, Home, and End move focus while disabled tabs are skipped.</dd>
            </div>
            <div>
              <dt>Activation</dt>
              <dd>Automatic mode selects on focus; manual mode waits for Enter or Space.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Selection, content, and indicator position update immediately.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
