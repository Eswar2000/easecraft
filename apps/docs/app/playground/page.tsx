import type { Metadata } from "next";

import { PlaygroundWorkbench } from "./playground-workbench";

export const metadata: Metadata = {
  title: "Motion Playground | Easecraft",
  description: "Tune accessible Easecraft motion and generate validated React code.",
};

export default function PlaygroundPage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Easecraft component explorer">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>Easecraft</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/">Components</a>
          <a href="/compositions">Compositions</a>
          <a aria-current="page" href="/playground">
            Playground
          </a>
          <a href="https://github.com/Eswar2000/easecraft">GitHub</a>
        </nav>
        <span className="release-status">Interactive preview</span>
      </header>

      <main className="playground-main">
        <section className="explorer-heading" aria-labelledby="playground-title">
          <div>
            <p className="eyebrow">Playground / Version 01</p>
            <h1 id="playground-title">Motion workbench</h1>
          </div>
          <p className="heading-note">Tune real components. Generate only validated React.</p>
        </section>

        <PlaygroundWorkbench />
      </main>
    </div>
  );
}
