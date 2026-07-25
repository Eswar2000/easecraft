"use client";

import { MotionProvider, TextReveal } from "easecraft";
import { useDeferredValue, useState } from "react";

const categories = ["All", "Text", "Layout", "Overlay", "Feedback"] as const;

type Category = (typeof categories)[number];
type DemoCategory = Exclude<Category, "All">;

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
    status: "Planned",
  },
  {
    category: "Layout",
    description: "Insertion and removal with bounded stagger.",
    kind: "list",
    name: "Staggered List",
    slug: "staggered-list",
    status: "Planned",
  },
  {
    category: "Layout",
    description: "Keyboard-ready panels with a moving indicator.",
    kind: "tabs",
    name: "Animated Tabs",
    slug: "animated-tabs",
    status: "Planned",
  },
  {
    category: "Overlay",
    description: "Focus-safe presence with retained exit content.",
    kind: "dialog",
    name: "Motion Dialog",
    slug: "motion-dialog",
    status: "Planned",
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
        <div className="number-preview">
          <span>+</span>12,480
        </div>
      );
    case "list":
      return (
        <div className="list-preview" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      );
    case "tabs":
      return (
        <div className="tabs-preview" aria-hidden="true">
          <span>Enter</span>
          <span>Move</span>
          <span>Exit</span>
          <i />
        </div>
      );
    case "dialog":
      return (
        <div className="dialog-preview" aria-hidden="true">
          <span />
          <div>
            <i />
            <i />
          </div>
        </div>
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
                      {demo.slug === "text-reveal" ? (
                        <a className="component-title-link" href="/components/text-reveal">
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
