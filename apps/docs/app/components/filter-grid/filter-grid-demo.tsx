"use client";

import {
  FilterGrid,
  MotionProvider,
  type FilterGridFilter,
  type FilterGridItemState,
} from "easecraft";
import { useState } from "react";

interface GalleryItem {
  readonly category: "component" | "foundation" | "feedback";
  readonly id: number;
  readonly name: string;
  readonly note: string;
}

type GalleryFilter = "all" | GalleryItem["category"] | "archived";

const galleryItems = [
  { category: "foundation", id: 1, name: "Motion", note: "Single-element presets" },
  { category: "foundation", id: 2, name: "Presence", note: "Retained lifecycle" },
  { category: "component", id: 3, name: "Animated Tabs", note: "Keyboard navigation" },
  { category: "component", id: 4, name: "Motion Dialog", note: "Modal focus" },
  { category: "feedback", id: 5, name: "Number Ticker", note: "Numeric feedback" },
  { category: "feedback", id: 6, name: "Toast Stack", note: "Live notifications" },
] satisfies readonly GalleryItem[];

const galleryFilters = [
  { label: "All", matches: () => true, value: "all" },
  {
    label: "Foundations",
    matches: (item) => item.category === "foundation",
    value: "foundation",
  },
  {
    label: "Components",
    matches: (item) => item.category === "component",
    value: "component",
  },
  {
    label: "Feedback",
    matches: (item) => item.category === "feedback",
    value: "feedback",
  },
  { label: "Archived", matches: () => false, value: "archived" },
] satisfies readonly FilterGridFilter<GalleryItem, GalleryFilter>[];

function GalleryCard({ item, state }: { item: GalleryItem; state: FilterGridItemState }) {
  return (
    <article className="filter-demo-card" data-state={state}>
      <span>{item.id.toString().padStart(2, "0")}</span>
      <div>
        <h3>{item.name}</h3>
        <p>{item.note}</p>
      </div>
      <button type="button">Inspect {item.name}</button>
    </article>
  );
}

export function FilterGridDemo() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [value, setValue] = useState<GalleryFilter>("all");

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="filter-demo" aria-label="Filter Grid interactive preview">
        <div className="filter-demo-toolbar">
          <span className="filter-demo-mode">Controlled / {value}</span>
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
        <div className="filter-demo-stage">
          <span className="stage-label">Component gallery / controlled filters</span>
          <FilterGrid
            as="section"
            className="filter-demo-surface"
            controlClassName="filter-demo-control"
            controlsClassName="filter-demo-controls"
            controlsLabel="Filter component gallery"
            empty={<span>No archived components.</span>}
            emptyClassName="filter-demo-empty"
            filters={galleryFilters}
            getKey={(item) => item.id}
            gridClassName="filter-demo-grid"
            items={galleryItems}
            onValueChange={setValue}
            resultClassName="filter-demo-results"
            resultLabel={(count, filter) =>
              `${count.toString()} ${count === 1 ? "component" : "components"} / ${filter?.value ?? "none"}`
            }
            value={value}
          >
            {(item, state) => <GalleryCard item={item} state={state} />}
          </FilterGrid>
        </div>
      </section>
    </MotionProvider>
  );
}
