import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { FilterGridDemo } from "./filter-grid-demo";

export const metadata: Metadata = {
  title: "Filter Grid | Easecraft",
  description: "Accessible controlled filtering with retained exits and animated grid reflow.",
};

const usageCode = `import { FilterGrid } from "easecraft";

<FilterGrid
  items={projects}
  filters={projectFilters}
  getKey={(project) => project.id}
  value={activeFilter}
  onValueChange={setActiveFilter}
>
  {(project) => <ProjectCard project={project} />}
</FilterGrid>`;

const apiRows = [
  ["items", "readonly Item[]", "required", "Complete controlled item data"],
  ["filters", "readonly FilterGridFilter[]", "required", "Labels, values, and predicates"],
  ["getKey", "(item) => React.Key", "required", "Stable item identity"],
  ["children", "(item, state) => ReactNode", "required", "Grid item renderer"],
  ["value", "string", "uncontrolled", "Controlled active filter"],
  ["defaultValue", "string", "first enabled", "Initial uncontrolled filter"],
  ["onValueChange", "(value) => void", "none", "Filter selection callback"],
  ["resultLabel", "(count, filter) => ReactNode", "count + result(s)", "Live result text"],
  ["empty", "ReactNode", "default message", "Zero-result content"],
  ["duration", "duration token | number", '"normal"', "Entry and reflow duration"],
  ["exitDuration", "duration token | number", '"fast"', "Filtered-item exit duration"],
  ["interval", "stagger token | number", '"normal"', "Entry/exit sequence interval"],
  ["maxDelay", "duration token | number", '"slow"', "Maximum stagger span"],
  ["distance", "distance token | number", '"medium"', "Entry and exit travel"],
  ["as", "HTML tag", '"div"', "Polymorphic host element"],
] as const;

export default function FilterGridPage() {
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
            <h1 id="component-title">Filter Grid</h1>
          </div>
          <p>
            Filter keyed collections without tearing focus away. Target counts update immediately,
            excluded cards retain their exits, and the remaining grid flows into place.
          </p>
        </section>

        <FilterGridDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="filter-grid" />
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
              <dt>Keyboard controls</dt>
              <dd>Every filter is a native pressed button with a visible focus indicator.</dd>
            </div>
            <div>
              <dt>Focus stability</dt>
              <dd>Filtering a focused card moves focus to its nearest remaining neighbor.</dd>
            </div>
            <div>
              <dt>Result announcements</dt>
              <dd>The target count is announced once, independent from animation frames.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Filtering and layout changes settle immediately while semantics stay intact.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
