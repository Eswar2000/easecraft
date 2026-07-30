import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { ToastStackDemo } from "./toast-stack-demo";

export const metadata: Metadata = {
  title: "Toast Stack | Easecraft",
  description: "Accessible queued notifications with pausable timers and animated reflow.",
};

const usageCode = `import { ToastStack } from "easecraft";

<ToastStack
  items={notifications}
  limit={3}
  onDismiss={(id) => removeNotification(id)}
/>`;

const apiRows = [
  ["items", "readonly ToastStackItem[]", "required", "Controlled notification queue"],
  ["onDismiss", "(id, reason) => void", "required", "Remove request callback"],
  ["limit", "number", "3", "Maximum visible notifications"],
  ["duration", "number", "5000", "Default auto-dismiss delay"],
  ["priority", '"polite" | "assertive"', '"polite"', "Per-item announcement priority"],
  ["entryDuration", "duration token | number", '"normal"', "Entry duration"],
  ["exitDuration", "duration token | number", '"fast"', "Exit duration"],
  ["reflowDuration", "duration token | number", '"normal"', "Stack reflow duration"],
  ["distance", "distance token | number", '"medium"', "Entry and exit travel"],
  ["swipeDirection", '"up" | "down" | "left" | "right"', '"right"', "Swipe dismissal axis"],
  ["swipeThreshold", "number", "50", "Required swipe distance"],
  ["hotkey", "string[]", '["F8"]', "Viewport focus shortcut"],
  ["onPauseChange", "(id, paused) => void", "none", "Timer pause notifications"],
  ["announcerContainer", "Element", "document.body", "Live-region portal target"],
] as const;

export default function ToastStackPage() {
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
            <h1 id="component-title">Toast Stack</h1>
          </div>
          <p>
            Queue polite and urgent notifications without flooding the viewport. Radix handles
            announcements, timers, focus, and swipe while Easecraft retains exits and animates
            reflow.
          </p>
        </section>

        <ToastStackDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="toast-stack" />
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
              <dt>Announcements</dt>
              <dd>Polite notices use a status region; urgent notices use assertive priority.</dd>
            </div>
            <div>
              <dt>Pausable timers</dt>
              <dd>Hover, focus, and window blur pause auto-dismiss until interaction ends.</dd>
            </div>
            <div>
              <dt>Keyboard</dt>
              <dd>F8 focuses the viewport and every close or action control remains reachable.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Entry, exit, and reflow settle immediately without changing announcements.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
