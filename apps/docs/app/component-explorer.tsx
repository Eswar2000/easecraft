"use client";

import {
  AnimatedAccordion,
  AnimatedTabs,
  FilterGrid,
  MotionDialog,
  MotionProvider,
  NumberTicker,
  ScrollReveal,
  StaggeredList,
  TextReveal,
  ToastStack,
  type FilterGridFilter,
  type ToastStackItem,
} from "easecraft";
import {
  componentCategories,
  componentSlugs,
  listComponents,
  type ComponentSlug,
  type ComponentStatus,
} from "easecraft-registry";
import { useDeferredValue, useState } from "react";

const categories = ["All", ...componentCategories] as const;
const componentDemos = listComponents();

type Category = (typeof categories)[number];

const listPreviewItems = [
  { id: "one", width: "100%" },
  { id: "two", width: "82%" },
  { id: "three", width: "92%" },
] as const;

function getListPreviewKey(item: (typeof listPreviewItems)[number]) {
  return item.id;
}

const tabsPreviewItems = [
  { id: "enter", label: "Enter", panel: "Ready" },
  { id: "move", label: "Move", panel: "Active" },
  { id: "exit", label: "Exit", panel: "Complete" },
] as const;

function getTabsPreviewLabel(item: (typeof tabsPreviewItems)[number]) {
  return item.label;
}

function getTabsPreviewValue(item: (typeof tabsPreviewItems)[number]) {
  return item.id;
}

const accordionPreviewItems = [
  { id: "height", label: "Measured height", panel: "Content sets the endpoint." },
  { id: "access", label: "Keyboard ready", panel: "Focus follows the APG pattern." },
] as const;

function getAccordionPreviewLabel(item: (typeof accordionPreviewItems)[number]) {
  return item.label;
}

function getAccordionPreviewValue(item: (typeof accordionPreviewItems)[number]) {
  return item.id;
}

const filterPreviewItems = [
  { category: "core", id: "motion", label: "Motion" },
  { category: "component", id: "tabs", label: "Tabs" },
  { category: "component", id: "dialog", label: "Dialog" },
  { category: "core", id: "presence", label: "Presence" },
] as const;

type FilterPreviewItem = (typeof filterPreviewItems)[number];
type FilterPreviewValue = "all" | FilterPreviewItem["category"];

const filterPreviewFilters = [
  { label: "All", matches: () => true, value: "all" },
  { label: "Core", matches: (item) => item.category === "core", value: "core" },
  {
    label: "UI",
    matches: (item) => item.category === "component",
    value: "component",
  },
] satisfies readonly FilterGridFilter<FilterPreviewItem, FilterPreviewValue>[];

interface PreviewProps {
  kind: ComponentSlug;
  reducedMotion: boolean;
}

function getStatusLabel(status: ComponentStatus) {
  return status === "implemented" ? "Implemented" : "Planned";
}

const toastPreviewViewportStyle = {
  inset: "auto",
  maxWidth: "none",
  position: "relative",
  width: "100%",
} as const;

function ToastPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const [items, setItems] = useState<ToastStackItem<number>[]>([]);

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <div className="toast-preview">
        <button
          className="toast-preview-trigger"
          type="button"
          onClick={() => {
            setItems([
              {
                description: "Accessible and motion-aware.",
                duration: Infinity,
                id: 1,
                title: "Preview ready",
              },
            ]);
          }}
        >
          Show notification
        </button>
        <ToastStack
          closeClassName="toast-preview-close"
          contentClassName="toast-preview-content"
          items={items}
          limit={1}
          onDismiss={(id) => {
            setItems((current) => current.filter((item) => item.id !== id));
          }}
          viewportClassName="toast-preview-viewport"
          viewportStyle={toastPreviewViewportStyle}
        />
      </div>
    </MotionProvider>
  );
}

function Preview({ kind, reducedMotion }: PreviewProps) {
  switch (kind) {
    case "text-reveal":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <TextReveal as="p" className="preview-copy" duration="slow" stagger="tight">
            Motion with purpose.
          </TextReveal>
        </MotionProvider>
      );
    case "number-ticker":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <NumberTicker
            className="number-preview"
            duration="slow"
            from={9000}
            prefix="+"
            value={12480}
          />
        </MotionProvider>
      );
    case "staggered-list":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <StaggeredList
            aria-hidden="true"
            className="list-preview"
            duration="slow"
            getKey={getListPreviewKey}
            interval="tight"
            items={listPreviewItems}
            maxDelay="fast"
          >
            {(item) => <span style={{ width: item.width }} />}
          </StaggeredList>
        </MotionProvider>
      );
    case "animated-tabs":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <AnimatedTabs
            aria-label="Animated Tabs preview"
            className="tabs-preview"
            defaultValue="move"
            duration="slow"
            getLabel={getTabsPreviewLabel}
            getValue={getTabsPreviewValue}
            items={tabsPreviewItems}
          >
            {(item) => item.panel}
          </AnimatedTabs>
        </MotionProvider>
      );
    case "motion-dialog":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <MotionDialog
            closeClassName="dialog-preview-close"
            contentClassName="dialog-preview-content"
            description="A focus-safe modal rendered from the component explorer."
            overlayClassName="dialog-preview-overlay"
            title="Review release"
            trigger={
              <button className="dialog-preview-trigger" type="button">
                <span>Review release</span>
                <small>Open dialog</small>
              </button>
            }
          >
            <p>Keyboard focus remains inside until the exit motion completes.</p>
            <button type="button">Continue review</button>
          </MotionDialog>
        </MotionProvider>
      );
    case "toast-stack":
      return <ToastPreview reducedMotion={reducedMotion} />;
    case "filter-grid":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <FilterGrid
            className="filter-preview"
            controlClassName="filter-preview-control"
            controlsClassName="filter-preview-controls"
            controlsLabel="Filter Grid preview"
            filters={filterPreviewFilters}
            getKey={(item) => item.id}
            gridClassName="filter-preview-grid"
            items={filterPreviewItems}
            resultClassName="filter-preview-results"
          >
            {(item) => <span>{item.label}</span>}
          </FilterGrid>
        </MotionProvider>
      );
    case "scroll-reveal":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <ScrollReveal className="scroll-preview" duration="slow" threshold={0.1}>
            <span>Viewport observed</span>
            <i aria-hidden="true" />
          </ScrollReveal>
        </MotionProvider>
      );
    case "animated-accordion":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <AnimatedAccordion
            aria-label="Animated Accordion preview"
            bodyClassName="accordion-preview-body"
            className="accordion-preview"
            contentClassName="accordion-preview-content"
            defaultValue="height"
            duration="fast"
            getLabel={getAccordionPreviewLabel}
            getValue={getAccordionPreviewValue}
            headerClassName="accordion-preview-header"
            itemClassName="accordion-preview-item"
            items={accordionPreviewItems}
            triggerClassName="accordion-preview-trigger"
          >
            {(item) => item.panel}
          </AnimatedAccordion>
        </MotionProvider>
      );
  }
}

export function ComponentExplorer() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const visibleDemos = componentDemos.filter((demo) => {
    const matchesCategory = activeCategory === "All" || demo.category === activeCategory;
    const matchesQuery =
      deferredQuery.length === 0 ||
      demo.name.toLowerCase().includes(deferredQuery) ||
      demo.description.toLowerCase().includes(deferredQuery);

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="site-shell" data-reduced-motion={reducedMotion}>
      <header className="site-header">
        <a className="brand" href="#components" aria-label="Easecraft component explorer">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>Easecraft</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#components">Components</a>
          <a href="/compositions">Compositions</a>
          <a href="#motion-policy">Motion policy</a>
          <a href="https://github.com/Eswar2000/easecraft">GitHub</a>
        </nav>
        <span className="release-status">Foundation preview</span>
      </header>

      <main>
        <section className="explorer-heading" id="components" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">
              Registry / {componentSlugs.length.toString().padStart(2, "0")} previews
            </p>
            <h1 id="page-title">Component explorer</h1>
          </div>
          <p className="heading-note">Accessible motion primitives, inspected in place.</p>
        </section>

        <section className="explorer-toolbar" aria-label="Component filters">
          <div className="category-control" aria-label="Filter by category">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => {
                  setActiveCategory(category);
                }}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="toolbar-actions">
            <label className="search-field">
              <span className="visually-hidden">Search components</span>
              <input
                type="search"
                value={query}
                placeholder="Search components"
                onChange={(event) => {
                  setQuery(event.currentTarget.value);
                }}
              />
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
            <button
              className="replay-button"
              type="button"
              onClick={() => {
                setReplayKey((key) => key + 1);
              }}
            >
              Replay all
            </button>
          </div>
        </section>

        <div className="results-line" aria-live="polite">
          <span>{visibleDemos.length.toString().padStart(2, "0")} results</span>
          <span>React / Anime.js</span>
        </div>

        {visibleDemos.length > 0 ? (
          <section className="component-grid" aria-label="Component previews">
            {visibleDemos.map((demo, index) => {
              const statusLabel = getStatusLabel(demo.status);

              return (
                <article className="component-card" key={demo.slug}>
                  <div className="card-meta">
                    <span>{(index + 1).toString().padStart(2, "0")}</span>
                    <span>{demo.category}</span>
                    <span data-status={statusLabel}>{statusLabel}</span>
                  </div>
                  <div className="preview-frame">
                    <div className="preview-content" key={`${demo.slug}-${replayKey.toString()}`}>
                      <Preview kind={demo.slug} reducedMotion={reducedMotion} />
                    </div>
                  </div>
                  <div className="card-copy">
                    <div>
                      <h2>
                        {demo.status === "implemented" ? (
                          <a className="component-title-link" href={demo.docsPath}>
                            {demo.name}
                          </a>
                        ) : (
                          demo.name
                        )}
                      </h2>
                      <p>{demo.description}</p>
                    </div>
                    <span className="component-slug">/{demo.slug}</span>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="empty-state" role="status">
            <span>00</span>
            <p>No components match this view.</p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("All");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <section className="motion-policy" id="motion-policy" aria-labelledby="policy-title">
          <div>
            <p className="eyebrow">System contract</p>
            <h2 id="policy-title">Motion policy</h2>
          </div>
          <dl>
            <div>
              <dt>Entry</dt>
              <dd>Explain new state</dd>
            </div>
            <div>
              <dt>Exit</dt>
              <dd>Complete before removal</dd>
            </div>
            <div>
              <dt>Reduction</dt>
              <dd>Preserve meaning</dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
