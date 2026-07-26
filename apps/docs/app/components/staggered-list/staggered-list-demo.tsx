"use client";

import { MotionProvider, StaggeredList } from "easecraft";
import { useState } from "react";

interface QueueItem {
  readonly id: number;
  readonly label: string;
  readonly track: string;
}

const initialItems = [
  { id: 1, label: "Audit onboarding", track: "Accessibility" },
  { id: 2, label: "Tune list motion", track: "Motion" },
  { id: 3, label: "Review release notes", track: "Documentation" },
  { id: 4, label: "Publish preview", track: "Release" },
] satisfies readonly QueueItem[];

function getQueueItemKey(item: QueueItem) {
  return item.id;
}

export function StaggeredListDemo() {
  const [items, setItems] = useState<QueueItem[]>(() => [...initialItems]);
  const [nextId, setNextId] = useState(5);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="list-demo" aria-label="Staggered List interactive preview">
        <div className="list-demo-controls">
          <span className="list-demo-count" role="status" aria-live="polite">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          <button
            className="list-action-button"
            type="button"
            disabled={items.length >= 7}
            onClick={() => {
              setItems((current) => [
                ...current,
                { id: nextId, label: `Follow-up ${nextId.toString()}`, track: "New" },
              ]);
              setNextId((current) => current + 1);
            }}
          >
            Add item
          </button>
          <button
            className="list-action-button"
            type="button"
            disabled={items.length < 2}
            onClick={() => {
              setItems((current) => [...current].reverse());
            }}
          >
            Reverse
          </button>
          <button
            className="list-action-button list-reset-button"
            type="button"
            onClick={() => {
              setItems([...initialItems]);
              setNextId(5);
            }}
          >
            Reset
          </button>
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
        <div className="list-demo-stage">
          <span className="stage-label">Delivery queue / keyed items</span>
          {items.length > 0 ? (
            <StaggeredList
              aria-label="Delivery queue"
              className="staggered-demo-list"
              duration="normal"
              exitDuration="fast"
              getKey={getQueueItemKey}
              interval="tight"
              items={items}
              maxDelay="fast"
            >
              {(item, state) => (
                <div className="staggered-demo-item">
                  <span className="list-item-index">{item.id.toString().padStart(2, "0")}</span>
                  <span className="list-item-copy">
                    <strong>{item.label}</strong>
                    <small>{item.track}</small>
                  </span>
                  <span className="list-item-state" data-state={state}>
                    {state}
                  </span>
                  <button
                    className="list-remove-button"
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => {
                      setItems((current) =>
                        current.filter((currentItem) => currentItem.id !== item.id),
                      );
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </StaggeredList>
          ) : (
            <div className="list-demo-empty" role="status">
              Queue clear
            </div>
          )}
        </div>
      </section>
    </MotionProvider>
  );
}
