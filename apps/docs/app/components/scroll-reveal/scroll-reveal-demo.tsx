"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The bounded overflow region must accept keyboard focus. */

import { MotionProvider, ScrollReveal, type ScrollRevealPreset } from "easecraft";
import { useState } from "react";

const revealItems = [
  {
    id: "observe",
    index: "01",
    note: "A bounded IntersectionObserver watches this scroll pane, not the page.",
    title: "Observe locally",
  },
  {
    id: "animate",
    index: "02",
    note: "Opacity and transforms preserve layout dimensions during every reveal.",
    title: "Reveal without shift",
  },
  {
    id: "fallback",
    index: "03",
    note: "Server-rendered content stays readable when JavaScript or observation is unavailable.",
    title: "Remain available",
  },
] as const;

export function ScrollRevealDemo() {
  const [once, setOnce] = useState(true);
  const [preset, setPreset] = useState<ScrollRevealPreset>("fade-rise");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);

  function restart() {
    viewport?.scrollTo({ behavior: "instant", top: 0 });
    setRevealed([]);
    setReplayKey((current) => current + 1);
  }

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="scroll-demo" aria-label="Scroll Reveal interactive preview">
        <div className="scroll-demo-controls">
          <span className="scroll-demo-status" role="status" aria-live="polite">
            {revealed.length.toString()} / {revealItems.length.toString()} observed
          </span>
          <fieldset className="scroll-preset-control">
            <legend>Preset</legend>
            {(["fade", "rise", "fade-rise"] as const).map((nextPreset) => (
              <button
                key={nextPreset}
                type="button"
                aria-pressed={preset === nextPreset}
                onClick={() => {
                  setPreset(nextPreset);
                }}
              >
                {nextPreset}
              </button>
            ))}
          </fieldset>
          <label className="motion-switch">
            <input
              type="checkbox"
              checked={!once}
              onChange={(event) => {
                setOnce(!event.currentTarget.checked);
              }}
            />
            <span aria-hidden="true" />
            Repeat
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
          <button className="scroll-restart-button" type="button" onClick={restart}>
            Restart
          </button>
        </div>
        <div className="scroll-demo-stage">
          <span className="stage-label">Bounded viewport / scroll to reveal</span>
          <div
            aria-label="Scroll Reveal bounded viewport"
            className="scroll-demo-viewport"
            ref={setViewport}
            role="region"
            tabIndex={0}
          >
            <div className="scroll-demo-intro">
              <span>Scroll specimen</span>
              <h2>Move through the viewport</h2>
              <p>Each card begins visible in server markup and enhances only after hydration.</p>
            </div>
            {revealItems.map((item) => {
              const content = (
                <>
                  <span>{item.index}</span>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                </>
              );

              return (
                <div className="scroll-demo-slot" key={`${item.id}-${replayKey.toString()}`}>
                  {viewport ? (
                    <ScrollReveal
                      as="article"
                      className="scroll-demo-card"
                      distance="large"
                      duration="slow"
                      observerRoot={viewport}
                      onReveal={() => {
                        setRevealed((current) =>
                          current.includes(item.id) ? current : [...current, item.id],
                        );
                      }}
                      onVisibilityChange={(visible) => {
                        if (!visible) {
                          setRevealed((current) => current.filter((id) => id !== item.id));
                        }
                      }}
                      once={once}
                      preset={preset}
                      rootMargin="0px 0px -15% 0px"
                      threshold={0.25}
                    >
                      {content}
                    </ScrollReveal>
                  ) : (
                    <article className="scroll-demo-card">{content}</article>
                  )}
                </div>
              );
            })}
            <div className="scroll-demo-finish">
              <span>End of bounded viewport</span>
            </div>
          </div>
        </div>
      </section>
    </MotionProvider>
  );
}
