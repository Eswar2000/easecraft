import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { StaggeredListDemo } from "./staggered-list-demo";

export const metadata: Metadata = {
  title: "Staggered List | Easecraft",
  description: "Accessible animated insertion, removal, and reordering for React lists.",
};

const usageCode = `import { StaggeredList } from "easecraft";

<StaggeredList
  items={projects}
  getKey={(project) => project.id}
  preset="fade-rise"
>
  {(project) => <ProjectCard project={project} />}
</StaggeredList>`;

const apiRows = [
  ["items", "readonly Item[]", "required", "Controlled list data"],
  ["getKey", "(item) => React.Key", "required", "Stable item identity"],
  ["children", "(item, state) => ReactNode", "required", "List-item content renderer"],
  ["as", '"ul" | "ol"', '"ul"', "Semantic list host"],
  ["preset", '"fade" | "rise" | "fade-rise"', '"fade-rise"', "Entry and exit treatment"],
  ["interval", "stagger token | number", '"normal"', "Delay between item starts"],
  ["maxDelay", "duration token | number", '"slow"', "Maximum stagger span"],
  ["duration", "duration token | number", '"normal"', "Entry and reorder duration"],
  ["exitDuration", "duration token | number", '"fast"', "Removal duration"],
  ["order", '"forward" | "reverse"', '"forward"', "Stagger origin"],
  ["distance", "distance token | number", '"medium"', "Entry and exit travel"],
  ["easing", "easing token | string", '"enter"', "Entry easing"],
  ["exitEasing", "easing token | string", '"exit"', "Exit easing"],
  ["reorderEasing", "easing token | string", '"move"', "FLIP reorder easing"],
] as const;

export default function StaggeredListPage() {
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
            <h1 id="component-title">Staggered List</h1>
          </div>
          <p>
            Insert, remove, and reorder keyed data while preserving semantic list markup, DOM
            identity, and keyboard focus. Long sequences stay bounded by a maximum stagger span.
          </p>
        </section>

        <StaggeredListDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="staggered-list" />
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
              <dt>List semantics</dt>
              <dd>The host remains a real unordered or ordered list with one list item per key.</dd>
            </div>
            <div>
              <dt>Focus stability</dt>
              <dd>Removing a focused item moves focus to its nearest remaining neighbor.</dd>
            </div>
            <div>
              <dt>Exit retention</dt>
              <dd>
                Items remain visually present for exit motion but leave the accessibility tree.
              </dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Data changes apply immediately without entry, exit, or reorder animation.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
