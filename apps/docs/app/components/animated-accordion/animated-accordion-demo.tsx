"use client";

import { AnimatedAccordion, MotionProvider, type AnimatedAccordionMode } from "easecraft";
import { useState } from "react";

interface DetailItem {
  readonly disabled?: boolean;
  readonly id: "lifecycle" | "semantics" | "interruption" | "registry";
  readonly index: string;
  readonly label: string;
  readonly metric: string;
  readonly note: string;
}

const detailItems = [
  {
    id: "lifecycle",
    index: "01",
    label: "Intrinsic height",
    metric: "AUTO",
    note: "The panel measures its rendered body, animates to that exact height, then restores authored styles.",
  },
  {
    id: "semantics",
    index: "02",
    label: "Linked semantics",
    metric: "APG",
    note: "Stable trigger and region IDs preserve aria-controls and aria-labelledby in every state.",
  },
  {
    id: "interruption",
    index: "03",
    label: "Rapid reversal",
    metric: "SAFE",
    note: "Opening and closing transitions can reverse without accepting stale animation completions.",
  },
  {
    disabled: true,
    id: "registry",
    index: "04",
    label: "Registry metadata",
    metric: "NEXT",
    note: "This disabled item marks the next catalog milestone without entering the keyboard sequence.",
  },
] satisfies readonly DetailItem[];

type DetailValue = DetailItem["id"];

function getDetailLabel(item: DetailItem) {
  return (
    <>
      <span>{item.index}</span>
      <strong>{item.label}</strong>
      <small>{item.metric}</small>
    </>
  );
}

function getDetailValue(item: DetailItem) {
  return item.id;
}

function isDetailDisabled(item: DetailItem) {
  return item.disabled ?? false;
}

function renderDetail(item: DetailItem) {
  return (
    <div className="accordion-demo-panel">
      <p>{item.note}</p>
      <dl>
        <div>
          <dt>State</dt>
          <dd>Retained</dd>
        </div>
        <div>
          <dt>Cleanup</dt>
          <dd>Scoped</dd>
        </div>
      </dl>
    </div>
  );
}

export function AnimatedAccordionDemo() {
  const [collapsible, setCollapsible] = useState(true);
  const [mode, setMode] = useState<AnimatedAccordionMode>("single");
  const [multipleValue, setMultipleValue] = useState<readonly DetailValue[]>([
    "lifecycle",
    "semantics",
  ]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [singleValue, setSingleValue] = useState<DetailValue | undefined>("lifecycle");

  function reset() {
    setSingleValue("lifecycle");
    setMultipleValue(["lifecycle", "semantics"]);
    setReplayKey((current) => current + 1);
  }

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="accordion-demo" aria-label="Animated Accordion interactive preview">
        <div className="accordion-demo-controls">
          <fieldset className="accordion-control-group">
            <legend>Expansion</legend>
            {(["single", "multiple"] as const).map((nextMode) => (
              <button
                key={nextMode}
                type="button"
                aria-pressed={mode === nextMode}
                onClick={() => {
                  setMode(nextMode);
                }}
              >
                {nextMode}
              </button>
            ))}
          </fieldset>
          <label className="motion-switch" data-disabled={mode === "multiple" || undefined}>
            <input
              type="checkbox"
              checked={collapsible}
              disabled={mode === "multiple"}
              onChange={(event) => {
                setCollapsible(event.currentTarget.checked);
              }}
            />
            <span aria-hidden="true" />
            Collapsible
          </label>
          <label className="motion-switch">
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
          <button className="accordion-reset-button" type="button" onClick={reset}>
            Reset
          </button>
        </div>
        <div className="accordion-demo-stage">
          <span className="stage-label">System details / controlled</span>
          <aside className="accordion-demo-index" aria-label="Current configuration">
            <span>Mode</span>
            <strong>{mode}</strong>
            <dl>
              <div>
                <dt>Motion</dt>
                <dd>{reducedMotion ? "Reduced" : "Enabled"}</dd>
              </div>
              <div>
                <dt>Panels</dt>
                <dd>{detailItems.length.toString().padStart(2, "0")}</dd>
              </div>
            </dl>
          </aside>
          <div className="accordion-demo-surface" key={replayKey}>
            {mode === "multiple" ? (
              <AnimatedAccordion<DetailItem, DetailValue>
                aria-label="Motion system details"
                bodyClassName="accordion-demo-body"
                className="animated-accordion-demo"
                contentClassName="accordion-demo-content"
                duration="normal"
                getLabel={getDetailLabel}
                getValue={getDetailValue}
                headerClassName="accordion-demo-header"
                isDisabled={isDetailDisabled}
                itemClassName="accordion-demo-item"
                items={detailItems}
                mode="multiple"
                onValueChange={setMultipleValue}
                triggerClassName="accordion-demo-trigger"
                value={multipleValue}
              >
                {renderDetail}
              </AnimatedAccordion>
            ) : (
              <AnimatedAccordion<DetailItem, DetailValue>
                aria-label="Motion system details"
                bodyClassName="accordion-demo-body"
                className="animated-accordion-demo"
                collapsible={collapsible}
                contentClassName="accordion-demo-content"
                duration="normal"
                getLabel={getDetailLabel}
                getValue={getDetailValue}
                headerClassName="accordion-demo-header"
                isDisabled={isDetailDisabled}
                itemClassName="accordion-demo-item"
                items={detailItems}
                onValueChange={setSingleValue}
                triggerClassName="accordion-demo-trigger"
                value={singleValue}
              >
                {renderDetail}
              </AnimatedAccordion>
            )}
          </div>
        </div>
      </section>
    </MotionProvider>
  );
}
