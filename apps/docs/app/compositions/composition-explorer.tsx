"use client";

import {
  compositionCategories,
  listCompositions,
  type CompositionCategory,
} from "easecraft-registry";
import { useState } from "react";

import { CompositionPreview } from "./composition-preview";

const compositions = listCompositions();
const categories = ["All", ...compositionCategories] as const;
type CompositionFilter = "All" | CompositionCategory;

export function CompositionExplorer() {
  const [category, setCategory] = useState<CompositionFilter>("All");
  const [reducedMotion, setReducedMotion] = useState(false);
  const visibleCompositions = compositions.filter(
    (composition) => category === "All" || composition.category === category,
  );

  return (
    <div className="site-shell" data-reduced-motion={reducedMotion}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Easecraft component explorer">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>Easecraft</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/">Components</a>
          <a aria-current="page" href="/compositions">
            Compositions
          </a>
          <a href="/playground">Playground</a>
          <a href="https://github.com/Eswar2000/easecraft">GitHub</a>
        </nav>
        <span className="release-status">Registry preview</span>
      </header>

      <main className="composition-main">
        <section className="explorer-heading" aria-labelledby="composition-page-title">
          <div>
            <p className="eyebrow">
              Compositions / {compositions.length.toString().padStart(2, "0")} implemented
            </p>
            <h1 id="composition-page-title">Composition explorer</h1>
          </div>
          <p className="heading-note">
            Complete workflows assembled from the same accessible motion contracts.
          </p>
        </section>

        <section className="composition-toolbar" aria-label="Composition controls">
          <div className="category-control" aria-label="Filter compositions by category">
            {categories.map((nextCategory) => (
              <button
                key={nextCategory}
                type="button"
                aria-pressed={category === nextCategory}
                onClick={() => {
                  setCategory(nextCategory);
                }}
              >
                {nextCategory}
              </button>
            ))}
          </div>
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
        </section>

        <div className="results-line" aria-live="polite">
          <span>{visibleCompositions.length.toString().padStart(2, "0")} results</span>
          <span>Package / Copy source</span>
        </div>

        <section className="composition-grid" aria-label="Composition previews">
          {visibleCompositions.map((composition, index) => (
            <article className="composition-card" key={composition.slug}>
              <div className="card-meta">
                <span>{(index + 1).toString().padStart(2, "0")}</span>
                <span>{composition.category}</span>
                <span data-status="Implemented">Implemented</span>
              </div>
              <div className="composition-preview-frame">
                <CompositionPreview reducedMotion={reducedMotion} slug={composition.slug} />
              </div>
              <div className="composition-card-copy">
                <div>
                  <h2>
                    <a className="component-title-link" href={`/compositions/${composition.slug}`}>
                      {composition.name}
                    </a>
                  </h2>
                  <p>{composition.description}</p>
                </div>
                <span>{composition.componentDependencies.length.toString()} foundations</span>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
