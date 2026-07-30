import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { ScrollRevealDemo } from "./scroll-reveal-demo";

export const metadata: Metadata = {
  title: "Scroll Reveal | Easecraft",
  description: "Accessible viewport reveals with visible SSR and no-JavaScript fallbacks.",
};

const usageCode = `import { ScrollReveal } from "easecraft";

<ScrollReveal
  preset="fade-rise"
  threshold={0.2}
  rootMargin="0px 0px -10% 0px"
>
  <ProjectCard />
</ScrollReveal>`;

const apiRows = [
  ["children", "ReactNode", "required", "Content available before enhancement"],
  ["as", "HTML tag", '"div"', "Polymorphic semantic host"],
  ["observerRoot", "Element | Document | null", "viewport", "Bounded observer root"],
  ["threshold", "number | readonly number[]", "0.15", "Visible ratio required"],
  ["rootMargin", "string", '"0px 0px -10% 0px"', "Observer boundary adjustment"],
  ["once", "boolean", "true", "Disconnect after first completed reveal"],
  ["preset", '"fade" | "rise" | "fade-rise"', '"fade-rise"', "Reveal treatment"],
  ["duration", "duration token | number", '"normal"', "Reveal duration"],
  ["distance", "distance token | number", '"medium"', "Reveal travel"],
  ["delay", "number", "0", "Delay before reveal"],
  ["easing", "easing token | string", '"enter"', "Reveal easing"],
  ["onReveal", "() => void", "none", "Completed reveal callback"],
  ["onVisibilityChange", "(visible) => void", "none", "Repeat-mode visibility callback"],
] as const;

export default function ScrollRevealPage() {
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
            <h1 id="component-title">Scroll Reveal</h1>
          </div>
          <p>
            Reveal content inside the page or a bounded scroller without global scroll handlers.
            Server markup remains visible, dimensions stay stable, and observation is progressive.
          </p>
        </section>

        <ScrollRevealDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="scroll-reveal" />
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
              <dt>Progressive enhancement</dt>
              <dd>Content is visible in SSR markup and remains available without JavaScript.</dd>
            </div>
            <div>
              <dt>No layout shift</dt>
              <dd>Only opacity, visibility, and transforms change during observation.</dd>
            </div>
            <div>
              <dt>Bounded observation</dt>
              <dd>IntersectionObserver supports page and local scrolling roots without polling.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Content remains immediately visible and no observer or animation is created.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
