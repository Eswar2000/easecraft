import {
  AnimatedTabs,
  Motion,
  MotionProvider,
  NumberTicker,
  Presence,
  Stagger,
  StaggeredList,
  TextReveal,
  useAnime,
  useMotionConfig,
  type AnimeSetup,
  type PresenceRenderProps,
} from "easecraft";
import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

const integerFormatOptions = { maximumFractionDigits: 0 } satisfies Intl.NumberFormatOptions;
const consumerChecks = [
  { id: "scope", label: "Scoped lifecycle" },
  { id: "motion", label: "Reduced motion" },
  { id: "types", label: "Typed exports" },
] as const;
const consumerViews = [
  { id: "motion", label: "Motion", value: "Scoped" },
  { id: "a11y", label: "Access", value: "Semantic" },
] as const;

interface FixtureProps {
  readonly reduceMotion: boolean;
  readonly setReduceMotion: (reduceMotion: boolean) => void;
}

function PresenceSpecimen({ complete, state }: PresenceRenderProps) {
  const setupAnimation = useCallback<AnimeSetup<HTMLDivElement>>(
    ({ animate, reducedMotion, root, tokens }) => {
      if (state === "present") {
        return undefined;
      }

      const exiting = state === "exiting";

      animate(root, {
        duration: reducedMotion
          ? tokens.duration.instant
          : exiting
            ? tokens.duration.fast
            : tokens.duration.slow,
        ease: reducedMotion ? "linear" : exiting ? tokens.easing.exit : tokens.easing.enter,
        onComplete: complete,
        opacity: exiting ? [1, 0] : [0, 1],
        y: reducedMotion ? 0 : exiting ? [0, -12] : [18, 0],
      });

      return undefined;
    },
    [complete, state],
  );
  const rootRef = useAnime(setupAnimation);

  return (
    <Stagger
      as="div"
      className="motion-specimen"
      data-presence-state={state}
      interval="tight"
      maxDelay={100}
      ref={rootRef}
    >
      <span className="specimen-index">01</span>
      <TextReveal as="p" distance="small" duration="normal" split="words" stagger="tight">
        Motion should explain what changed.
      </TextReveal>
      <StaggeredList
        aria-label="Consumer checks"
        className="consumer-checks"
        duration="fast"
        getKey={(check) => check.id}
        interval="tight"
        items={consumerChecks}
        maxDelay="fast"
        preset="fade"
      >
        {(check) => (
          <span>
            <i aria-hidden="true" />
            {check.label}
          </span>
        )}
      </StaggeredList>
      <AnimatedTabs
        aria-label="Consumer view"
        className="consumer-tabs"
        duration="fast"
        getLabel={(view) => view.label}
        getValue={(view) => view.id}
        items={consumerViews}
      >
        {(view) => <span>{view.value} contract</span>}
      </AnimatedTabs>
      <div className="timeline" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </Stagger>
  );
}

function Fixture({ reduceMotion, setReduceMotion }: FixtureProps) {
  const [metricValue, setMetricValue] = useState(12480);
  const [specimenPresent, setSpecimenPresent] = useState(true);
  const { tokens } = useMotionConfig();
  const motionTokens = [
    {
      label: "duration.normal",
      value: `${tokens.duration.normal.toString()}ms`,
    },
    { label: "easing.enter", value: tokens.easing.enter },
    {
      label: "distance.medium",
      value: `${tokens.distance.medium.toString()}px`,
    },
  ] as const;

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
                checked={reduceMotion}
                onChange={(event) => {
                  setReduceMotion(event.currentTarget.checked);
                }}
              />
              <span aria-hidden="true" />
              Reduce motion
            </label>
            <button
              type="button"
              onClick={() => {
                setMetricValue((current) => current + 375);
              }}
            >
              Update value
            </button>
            <button
              type="button"
              onClick={() => {
                setSpecimenPresent((current) => !current);
              }}
            >
              {specimenPresent ? "Remove" : "Show"}
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
            <Presence present={specimenPresent}>
              {(props) => <PresenceSpecimen {...props} />}
            </Presence>
          </div>

          <Motion as="aside" aria-labelledby="token-title" className="token-panel" preset="fade">
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
              <div>
                <dt>consumer.metric</dt>
                <dd>
                  <NumberTicker
                    announce="polite"
                    formatOptions={integerFormatOptions}
                    prefix="+"
                    value={metricValue}
                  />
                </dd>
              </div>
            </dl>
            <p className="fixture-status">
              <span aria-hidden="true">PASS</span>
              Consumer build ready
            </p>
          </Motion>
        </section>
      </main>
    </div>
  );
}

function App() {
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <MotionProvider reducedMotion={reduceMotion ? "always" : "never"}>
      <Fixture reduceMotion={reduceMotion} setReduceMotion={setReduceMotion} />
    </MotionProvider>
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
