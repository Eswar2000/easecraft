"use client";

import { MotionProvider, NumberTicker } from "easecraft";
import { useState } from "react";

const integerFormatOptions = { maximumFractionDigits: 0 } satisfies Intl.NumberFormatOptions;

export function NumberTickerDemo() {
  const [locale, setLocale] = useState("en-US");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [value, setValue] = useState(12480);

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="number-demo" aria-label="Number Ticker interactive preview">
        <div className="number-demo-controls">
          <label className="number-control-field">
            Value
            <input
              type="number"
              value={value}
              onChange={(event) => {
                const nextValue = event.currentTarget.valueAsNumber;

                if (Number.isFinite(nextValue)) {
                  setValue(nextValue);
                }
              }}
            />
          </label>
          <label className="number-control-field">
            Locale
            <select
              value={locale}
              onChange={(event) => {
                setLocale(event.currentTarget.value);
              }}
            >
              <option value="en-US">English (US)</option>
              <option value="de-DE">Deutsch</option>
              <option value="en-IN">English (India)</option>
            </select>
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
              setValue((current) => current + 1250);
            }}
          >
            Add 1,250
          </button>
        </div>
        <div className="number-demo-stage">
          <span className="stage-label">Revenue / {locale}</span>
          <NumberTicker
            announce="polite"
            as="output"
            className="number-demo-value"
            duration="slow"
            formatOptions={integerFormatOptions}
            locale={locale}
            prefix="$"
            value={value}
          />
          <p>Final values are announced once; intermediate frames stay visual-only.</p>
        </div>
      </section>
    </MotionProvider>
  );
}
