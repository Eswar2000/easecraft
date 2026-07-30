import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { TextRevealDemo } from "./text-reveal-demo";

export const metadata: Metadata = {
  title: "Text Reveal | Easecraft",
  description: "Accessible line, word, and character reveal animations for React.",
};

const usageCode = `import { TextReveal } from "easecraft";

<TextReveal as="h2" split="words" preset="fade-rise">
  Motion should explain what changed.
</TextReveal>`;

const apiRows = [
  ["children", "string", "required", "Readable source text"],
  ["as", "HTML tag", '"span"', "Semantic host element"],
  ["split", '"lines" | "words" | "characters"', '"words"', "Animated unit"],
  ["preset", '"fade" | "rise" | "fade-rise"', '"fade-rise"', "Reveal behavior"],
  ["duration", "duration token | number", '"normal"', "Per-unit duration in ms"],
  ["distance", "distance token | number", '"medium"', "Spatial travel in px"],
  ["stagger", "stagger token | number", '"normal"', "Delay between units"],
  ["easing", "easing token | string", '"enter"', "Anime.js easing"],
  ["delay", "number", "0", "Initial delay in ms"],
  ["onComplete", "() => void", "none", "Completion notification"],
] as const;

export default function TextRevealPage() {
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
            <p className="eyebrow">Component / Text</p>
            <h1 id="component-title">Text Reveal</h1>
          </div>
          <p>
            Reveal text by line, word, or character while preserving one coherent accessible name
            and restoring the original markup on cleanup.
          </p>
        </section>

        <TextRevealDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="text-reveal" />
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
              <dt>Screen readers</dt>
              <dd>Receive one hidden semantic clone; animated visual units are aria-hidden.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Skips text splitting and uses a short opacity-only transition.</dd>
            </div>
            <div>
              <dt>Server rendering</dt>
              <dd>Outputs the original readable text before client-side enhancement.</dd>
            </div>
            <div>
              <dt>Cleanup</dt>
              <dd>Restores the original HTML and removes scoped animation styles.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
