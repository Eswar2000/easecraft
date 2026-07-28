import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  compositionSlugs,
  getComponent,
  getComposition,
  isCompositionSlug,
} from "easecraft-registry";

import { CompositionPreview } from "../composition-preview";
import { CompositionDeliveryPanel } from "./composition-delivery-panel";

interface CompositionPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export function generateStaticParams() {
  return compositionSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CompositionPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isCompositionSlug(slug)) {
    return {};
  }

  const composition = getComposition(slug);
  return {
    title: `${composition.name} | Easecraft`,
    description: composition.description,
  };
}

export default async function CompositionPage({ params }: CompositionPageProps) {
  const { slug } = await params;

  if (!isCompositionSlug(slug)) {
    notFound();
  }

  const composition = getComposition(slug);
  const foundations = composition.componentDependencies.map((dependency) =>
    getComponent(dependency),
  );

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Easecraft component explorer">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>Easecraft</span>
        </a>
        <nav aria-label="Composition navigation">
          <a href="/">Components</a>
          <a href="/compositions">Compositions</a>
          <a href="#delivery">Delivery</a>
        </nav>
        <span className="release-status">Implemented</span>
      </header>

      <main className="composition-detail-main">
        <section className="component-detail-heading" aria-labelledby="composition-title">
          <div>
            <p className="eyebrow">Composition / {composition.category}</p>
            <h1 id="composition-title">{composition.name}</h1>
          </div>
          <p>{composition.description}</p>
        </section>

        <section className="composition-detail-preview" aria-label={`${composition.name} preview`}>
          <div className="composition-detail-ruler" aria-hidden="true">
            <span>Package</span>
            <span>Copy source</span>
            <span>Reduced motion</span>
          </div>
          <CompositionPreview slug={composition.slug} />
        </section>

        <div id="delivery">
          <CompositionDeliveryPanel slug={composition.slug} />
        </div>

        <section className="composition-doc-band" aria-labelledby="foundation-title">
          <div>
            <p className="eyebrow">Component graph</p>
            <h2 id="foundation-title">Foundations</h2>
          </div>
          <div className="composition-foundation-list">
            {foundations.map((foundation) => (
              <a href={foundation.docsPath} key={foundation.slug}>
                <span>{foundation.category}</span>
                <strong>{foundation.name}</strong>
                <small>{foundation.exportName}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="composition-doc-band" aria-labelledby="keyboard-title">
          <div>
            <p className="eyebrow">Interaction contract</p>
            <h2 id="keyboard-title">Keyboard</h2>
          </div>
          <dl className="composition-keyboard-list">
            {composition.accessibility.keyboard.map((interaction) => (
              <div key={`${interaction.keys.join("-")}:${interaction.behavior}`}>
                <dt>{interaction.keys.join(" / ")}</dt>
                <dd>{interaction.behavior}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="composition-doc-band" aria-labelledby="accessibility-title">
          <div>
            <p className="eyebrow">Release requirement</p>
            <h2 id="accessibility-title">Accessibility</h2>
          </div>
          <dl className="composition-accessibility-list">
            <div>
              <dt>Pattern</dt>
              <dd>{composition.accessibility.pattern}</dd>
            </div>
            <div>
              <dt>Focus management</dt>
              <dd>Required</dd>
            </div>
            <div>
              <dt>Reduced motion</dt>
              <dd>Immediate semantic fallback</dd>
            </div>
            {composition.accessibility.notes.map((note) => (
              <div key={note}>
                <dt>Note</dt>
                <dd>{note}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
