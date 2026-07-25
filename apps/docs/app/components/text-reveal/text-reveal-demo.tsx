"use client";

import { MotionProvider, TextReveal, type TextRevealSplit } from "easecraft";
import { useState } from "react";

const splitOptions = ["lines", "words", "characters"] as const satisfies readonly TextRevealSplit[];

export function TextRevealDemo() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [split, setSplit] = useState<TextRevealSplit>("words");

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="text-demo" aria-label="Text Reveal interactive preview">
        <div className="text-demo-controls">
          <div className="segmented-control" role="group" aria-label="Split text by">
            {splitOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={split === option}
                onClick={() => {
                  setSplit(option);
                }}
              >
                {option}
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
          <button
            className="replay-button"
            type="button"
            onClick={() => {
              setReplayKey((key) => key + 1);
            }}
          >
            Replay
          </button>
        </div>
        <div className="text-demo-stage">
          <span className="stage-label">Preview / {split}</span>
          <TextReveal
            as="h2"
            className="text-demo-copy"
            duration="slow"
            key={replayKey}
            split={split}
            stagger={split === "characters" ? "tight" : "normal"}
          >
            Motion should explain what changed.
          </TextReveal>
        </div>
      </section>
    </MotionProvider>
  );
}
