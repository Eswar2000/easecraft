import {
  AnimatedAccordion,
  AnimatedTabs,
  FilterGrid,
  Motion,
  MotionDialog,
  MotionProvider,
  NumberTicker,
  Presence,
  ScrollReveal,
  Stagger,
  StaggeredList,
  TextReveal,
  ToastStack,
  useAnime,
  useMotionConfig,
  type AnimeSetup,
  type FilterGridFilter,
  type PresenceRenderProps,
  type ToastStackItem,
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
const consumerAccordionItems = [
  { id: "height", label: "Measured height", panel: "Intrinsic panel motion" },
  { id: "keys", label: "Keyboard", panel: "Arrow, Home, and End" },
] as const;
const consumerCatalog = [
  { category: "core", id: "motion", label: "Motion" },
  { category: "core", id: "presence", label: "Presence" },
  { category: "component", id: "tabs", label: "Tabs" },
  { category: "component", id: "toast", label: "Toast" },
] as const;

type ConsumerCatalogItem = (typeof consumerCatalog)[number];
type ConsumerCatalogFilter = "all" | ConsumerCatalogItem["category"];

const consumerCatalogFilters = [
  { label: "All", matches: () => true, value: "all" },
  { label: "Core", matches: (item) => item.category === "core", value: "core" },
  {
    label: "Components",
    matches: (item) => item.category === "component",
    value: "component",
  },
] satisfies readonly FilterGridFilter<ConsumerCatalogItem, ConsumerCatalogFilter>[];

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
      <FilterGrid
        className="consumer-catalog"
        controlClassName="consumer-catalog-filter"
        controlsClassName="consumer-catalog-controls"
        filters={consumerCatalogFilters}
        getKey={(item) => item.id}
        gridClassName="consumer-catalog-grid"
        items={consumerCatalog}
        resultClassName="consumer-catalog-results"
      >
        {(item) => <span>{item.label}</span>}
      </FilterGrid>
      <AnimatedAccordion
        aria-label="Consumer accordion"
        bodyClassName="consumer-accordion-body"
        className="consumer-accordion"
        contentClassName="consumer-accordion-content"
        defaultValue="height"
        duration="fast"
        getLabel={(item) => item.label}
        getValue={(item) => item.id}
        headerClassName="consumer-accordion-header"
        itemClassName="consumer-accordion-item"
        items={consumerAccordionItems}
        triggerClassName="consumer-accordion-trigger"
      >
        {(item) => item.panel}
      </AnimatedAccordion>
      <div>
        <ScrollReveal
          as="div"
          className="consumer-scroll-reveal"
          duration="fast"
          rootMargin="0px 0px -10% 0px"
          threshold={0.2}
        >
          <i aria-hidden="true" />
          Viewport observer
        </ScrollReveal>
      </div>
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
  const [notificationId, setNotificationId] = useState(1);
  const [notifications, setNotifications] = useState<ToastStackItem<number>[]>([]);
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
            <MotionDialog
              closeClassName="fixture-dialog-close"
              contentClassName="fixture-dialog-content"
              description="This modal is rendered from the installed workspace package."
              overlayClassName="fixture-dialog-overlay"
              title="Consumer dialog"
              trigger={<button type="button">Open dialog</button>}
            >
              <p>Focus, Escape, scroll locking, and exit retention are active.</p>
              <button type="button">Confirm fixture</button>
            </MotionDialog>
            <button
              type="button"
              onClick={() => {
                const id = notificationId;
                setNotificationId((current) => current + 1);
                setNotifications((current) => [
                  ...current,
                  {
                    description: "Generated by the Vite consumer fixture.",
                    id,
                    title: `Consumer notification ${id.toString()}`,
                  },
                ]);
              }}
            >
              Notify
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
      <ToastStack
        closeClassName="fixture-toast-close"
        contentClassName="fixture-toast-content"
        items={notifications}
        limit={2}
        onDismiss={(id) => {
          setNotifications((current) => current.filter((item) => item.id !== id));
        }}
        viewportClassName="fixture-toast-viewport"
      />
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
