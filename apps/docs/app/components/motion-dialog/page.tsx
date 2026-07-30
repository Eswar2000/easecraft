import type { Metadata } from "next";

import { ComponentDeliveryPanel } from "../component-delivery-panel";
import { MotionDialogDemo } from "./motion-dialog-demo";

export const metadata: Metadata = {
  title: "Motion Dialog | Easecraft",
  description: "Accessible modal presence with focus-safe animated entry and exit for React.",
};

const usageCode = `import { MotionDialog } from "easecraft";

<MotionDialog
  title="Publish release?"
  description="Review the release checks first."
  trigger={<button type="button">Review release</button>}
>
  <ReleaseChecklist />
</MotionDialog>`;

const apiRows = [
  ["trigger", "ReactElement", "required", "Trigger receiving Radix semantics"],
  ["title", "ReactNode", "required", "Accessible dialog name"],
  ["description", "ReactNode", "none", "Accessible dialog description"],
  ["children", "ReactNode", "required", "Modal body content"],
  ["open", "boolean", "uncontrolled", "Controlled requested state"],
  ["defaultOpen", "boolean", "false", "Initial uncontrolled state"],
  ["onOpenChange", "(open) => void", "none", "Requested state callback"],
  ["onAfterOpen", "() => void", "none", "Entry completion callback"],
  ["onAfterClose", "() => void", "none", "Exit completion callback"],
  ["dismissible", "boolean", "true", "Escape and backdrop dismissal"],
  ["initialFocusRef", "RefObject", "first focusable", "Preferred initial focus"],
  ["duration", "duration token | number", '"normal"', "Entry duration"],
  ["exitDuration", "duration token | number", '"fast"', "Exit duration"],
  ["distance", "distance token | number", '"medium"', "Panel travel distance"],
  ["easing", "easing token | string", '"enter"', "Entry easing"],
  ["exitEasing", "easing token | string", '"exit"', "Exit easing"],
] as const;

export default function MotionDialogPage() {
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
            <p className="eyebrow">Component / Overlay</p>
            <h1 id="component-title">Motion Dialog</h1>
          </div>
          <p>
            Present modal work without compromising focus. Radix provides proven semantics and
            trapping while Easecraft retains the layer through interruptible exit motion.
          </p>
        </section>

        <MotionDialogDemo />

        <div id="delivery">
          <ComponentDeliveryPanel slug="motion-dialog" />
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
              <dt>Modal focus</dt>
              <dd>Focus moves inside, remains trapped, and returns to the trigger after exit.</dd>
            </div>
            <div>
              <dt>Dismissal</dt>
              <dd>Escape and backdrop presses request close when dismissal is enabled.</dd>
            </div>
            <div>
              <dt>Exit retention</dt>
              <dd>The modal remains mounted and inaccessible background content stays blocked.</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Open and close state settle immediately while all modal semantics remain.</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
