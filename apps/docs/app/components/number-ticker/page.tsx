import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { NumberTickerDemo } from "./number-ticker-demo";

export const metadata: Metadata = {
  title: "Number Ticker | Easecraft",
  description: "Accessible, locale-aware animated numbers for React.",
};

const usageCode = `import { NumberTicker } from "easecraft";

<NumberTicker
  announce="polite"
  locale="en-US"
  prefix="$"
  value={12480}
/>`;

const apiRows = [
  ["value", "number", "required", "Final semantic and visual value"],
  ["from", "number", "0", "Initial value on mount"],
  ["as", "HTML tag", '"span"', "Semantic host element"],
  ["locale", "Intl locale", "runtime default", "Locale-aware formatting"],
  ["formatOptions", "Intl.NumberFormatOptions", "none", "Number formatting rules"],
  ["prefix / suffix", "string", '""', "Text around the formatted number"],
  ["duration", "duration token | number", '"normal"', "Transition duration in ms"],
  ["easing", "easing token | string", '"move"', "Anime.js easing"],
  ["delay", "number", "0", "Initial delay in ms"],
  ["announce", '"off" | "polite" | "assertive"', '"off"', "Live-region priority"],
  ["onComplete", "(value) => void", "none", "Final-value notification"],
] as const;

export default function NumberTickerPage() {
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
            <p className="eyebrow">Component / Feedback</p>
            <h1 id="component-title">Number Ticker</h1>
          </div>
          <p>
            Animate changing values without exposing every intermediate frame to assistive
            technology. Formatting stays locale-aware and rapid updates continue from the last
            painted value.
          </p>
        </section>

        <NumberTickerDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="number-ticker" />
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
              <dt>Semantic value</dt>
              <dd>The hidden accessible node always contains the final formatted target.</dd>
            </div>
            <div>
              <dt>Announcements</dt>
              <dd>Off by default; polite or assertive modes announce only target changes.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Updates immediately without creating an animation.</dd>
            </div>
            <div>
              <dt>Rapid updates</dt>
              <dd>New targets continue from the last visual frame instead of restarting.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
