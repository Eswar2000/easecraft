import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const motionTokens = [
  { label: "duration.normal", value: "300ms" },
  { label: "easing.enter", value: "out(3)" },
  { label: "distance.medium", value: "12px" },
] as const;

function App() {
  const [replayKey, setReplayKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Easecraft consumer fixture home">
          <span className="wordmark-mark" aria-hidden="true">
            E
          </span>
          <span>Easecraft</span>
        </a>
        <div className="environment" aria-label="Fixture environment">
          <span className="status-dot" aria-hidden="true" />
          Vite / React 19 / workspace
        </div>
      </header>

      <main>
        <section className="fixture-heading" aria-labelledby="fixture-title">
          <div>
            <p className="eyebrow">Consumer fixture 01</p>
            <h1 id="fixture-title">Motion package smoke test</h1>
          </div>
          <div className="fixture-actions">
            <label className="motion-toggle">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => {
                  setReducedMotion(event.currentTarget.checked);
                }}
              />
              <span aria-hidden="true" />
              Reduce motion
            </label>
            <button
              type="button"
              onClick={() => {
                setReplayKey((key) => key + 1);
              }}
            >
              Replay
            </button>
          </div>
        </section>

        <section className="workspace" aria-label="Motion preview workspace">
          <div className="preview-stage">
            <div className="stage-ruler" aria-hidden="true">
              <span>000</span>
              <span>150</span>
              <span>300</span>
              <span>450</span>
            </div>
            <div key={replayKey} className="motion-specimen" data-reduced-motion={reducedMotion}>
              <span className="specimen-index">01</span>
              <p>Motion should explain what changed.</p>
              <div className="timeline" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>

          <aside className="token-panel" aria-labelledby="token-title">
            <div className="panel-heading">
              <p className="eyebrow">Resolved values</p>
              <h2 id="token-title">Motion tokens</h2>
            </div>
            <dl>
              {motionTokens.map((token) => (
                <div key={token.label}>
                  <dt>{token.label}</dt>
                  <dd>{token.value}</dd>
                </div>
              ))}
            </dl>
            <p className="fixture-status">
              <span aria-hidden="true">PASS</span>
              Consumer build ready
            </p>
          </aside>
        </section>
      </main>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
