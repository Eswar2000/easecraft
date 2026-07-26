"use client";

import {
  AnimatedTabs,
  MotionDialog,
  MotionProvider,
  NumberTicker,
  StaggeredList,
  TextReveal,
} from "easecraft";
import { useDeferredValue, useState } from "react";

const categories = ["All", "Text", "Layout", "Overlay", "Feedback"] as const;

type Category = (typeof categories)[number];
type DemoCategory = Exclude<Category, "All">;

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

interface ComponentDemo {
  category: DemoCategory;
  description: string;
  kind: "text" | "number" | "list" | "tabs" | "dialog" | "toast";
  name: string;
  slug: string;
  status: "Implemented" | "Planned";
}

const componentDemos = [
  {
    category: "Text",
    description: "Word-level entrance with readable source text.",
    kind: "text",
    name: "Text Reveal",
    slug: "text-reveal",
    status: "Implemented",
  },
  {
    category: "Feedback",
    description: "Numeric transitions with stable final output.",
    kind: "number",
    name: "Number Ticker",
    slug: "number-ticker",
    status: "Implemented",
  },
  {
    category: "Layout",
    description: "Insertion and removal with bounded stagger.",
    kind: "list",
    name: "Staggered List",
    slug: "staggered-list",
    status: "Implemented",
  },
  {
    category: "Layout",
    description: "Keyboard-ready panels with a moving indicator.",
    kind: "tabs",
    name: "Animated Tabs",
    slug: "animated-tabs",
    status: "Implemented",
  },
  {
    category: "Overlay",
    description: "Focus-safe presence with retained exit content.",
    kind: "dialog",
    name: "Motion Dialog",
    slug: "motion-dialog",
    status: "Implemented",
  },
  {
    category: "Feedback",
    description: "Live-region notifications with controlled reflow.",
    kind: "toast",
    name: "Toast Stack",
    slug: "toast-stack",
    status: "Planned",
  },
] as const satisfies readonly ComponentDemo[];

interface PreviewProps {
  kind: ComponentDemo["kind"];
  reducedMotion: boolean;
}

function Preview({ kind, reducedMotion }: PreviewProps) {
  switch (kind) {
    case "text":
      return (
        <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
          <TextReveal as="p" className="preview-copy" duration="slow" stagger="tight">
            Motion with purpose.
          </TextReveal>
        </MotionProvider>
      );
    case "number":
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
    case "list":
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
    case "tabs":
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
    case "dialog":
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
    case "toast":
      return (
        <div className="toast-preview" aria-hidden="true">
          <span />
          <span />
        </div>
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
          <a href="#motion-policy">Motion policy</a>
          <a href="https://github.com/Eswar2000/easecraft">GitHub</a>
        </nav>
        <span className="release-status">Foundation preview</span>
      </header>

      <main>
        <section className="explorer-heading" id="components" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Registry / 06 previews</p>
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
            {visibleDemos.map((demo, index) => (
              <article className="component-card" key={demo.slug}>
                <div className="card-meta">
                  <span>{(index + 1).toString().padStart(2, "0")}</span>
                  <span>{demo.category}</span>
                  <span data-status={demo.status}>{demo.status}</span>
                </div>
                <div className="preview-frame">
                  <div className="preview-content" key={`${demo.slug}-${replayKey.toString()}`}>
                    <Preview kind={demo.kind} reducedMotion={reducedMotion} />
                  </div>
                </div>
                <div className="card-copy">
                  <div>
                    <h2>
                      {demo.status === "Implemented" ? (
                        <a className="component-title-link" href={`/components/${demo.slug}`}>
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
            ))}
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
