"use client";

import {
  MotionProvider,
  ToastStack,
  type ToastStackItem,
  type ToastStackPriority,
} from "easecraft";
import { useState } from "react";

const toastDemoViewportStyle = {
  maxWidth: "calc(100% - 48px)",
  position: "absolute",
  right: 24,
  top: 70,
  width: 370,
} as const;

function createNotification(id: number, priority: ToastStackPriority): ToastStackItem<number> {
  const assertive = priority === "assertive";

  return {
    description: assertive
      ? "Keyboard verification needs attention."
      : "The latest component preview is available.",
    id,
    priority,
    title: assertive ? `Review required ${id.toString()}` : `Preview published ${id.toString()}`,
    ...(assertive
      ? {
          action: {
            altText: "Review accessibility checks",
            label: "Review",
          },
        }
      : {}),
  };
}

export function ToastStackDemo() {
  const [items, setItems] = useState<ToastStackItem<number>[]>([]);
  const [limit, setLimit] = useState(3);
  const [nextId, setNextId] = useState(1);
  const [pausedCount, setPausedCount] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  function add(priority: ToastStackPriority) {
    const id = nextId;
    setNextId((current) => current + 1);
    setItems((current) => [...current, createNotification(id, priority)]);
  }

  function addBurst() {
    const start = nextId;
    const additions = Array.from({ length: 4 }, (_, index) =>
      createNotification(start + index, index === 2 ? "assertive" : "polite"),
    );
    setNextId((current) => current + additions.length);
    setItems((current) => [...current, ...additions]);
  }

  const queuedCount = Math.max(0, items.length - limit);

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="toast-demo" aria-label="Toast Stack interactive preview">
        <div className="toast-demo-controls">
          <span className="toast-demo-status" role="status" aria-live="polite">
            {items.length} active / {queuedCount} queued{pausedCount > 0 ? " / paused" : ""}
          </span>
          <fieldset className="toast-limit-control">
            <legend>Visible</legend>
            {[2, 3].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={limit === value}
                onClick={() => {
                  setLimit(value);
                }}
              >
                {value}
              </button>
            ))}
          </fieldset>
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
        </div>
        <div className="toast-demo-stage">
          <span className="stage-label">Notification center / live updates</span>
          <div className="toast-launch-panel">
            <span className="toast-launch-index">06</span>
            <h2>Notification controls</h2>
            <p>Hover or focus the stack to pause every auto-dismiss timer.</p>
            <div className="toast-launch-actions">
              <button
                type="button"
                onClick={() => {
                  add("polite");
                }}
              >
                Add polite
              </button>
              <button
                type="button"
                onClick={() => {
                  add("assertive");
                }}
              >
                Add assertive
              </button>
              <button type="button" onClick={addBurst}>
                Add burst
              </button>
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <ToastStack
            actionClassName="toast-demo-action"
            closeClassName="toast-demo-close"
            contentClassName="toast-demo-content"
            duration={6000}
            items={items}
            limit={limit}
            onDismiss={(id) => {
              setItems((current) => current.filter((item) => item.id !== id));
            }}
            onPauseChange={(_, paused) => {
              setPausedCount((current) => Math.max(0, current + (paused ? 1 : -1)));
            }}
            viewportClassName="toast-demo-viewport"
            viewportStyle={toastDemoViewportStyle}
          />
        </div>
      </section>
    </MotionProvider>
  );
}
