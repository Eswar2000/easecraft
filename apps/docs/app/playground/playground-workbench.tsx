"use client";

import { MotionDialog, MotionProvider, StaggeredList, TextReveal } from "easecraft";
import { Check, Copy, Monitor, Play, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { startTransition, useId, useState, type ReactNode } from "react";

import { generatePlaygroundCode, getPlaygroundInstallCommand } from "./playground-code";
import {
  getDefaultPlaygroundState,
  parsePlaygroundState,
  playgroundComponents,
  playgroundContrasts,
  playgroundEasings,
  playgroundOrders,
  playgroundPresets,
  playgroundRanges,
  playgroundSplits,
  playgroundViewports,
  type PlaygroundComponent,
  type PlaygroundState,
} from "./playground-state";

const componentNames = {
  "motion-dialog": "Motion Dialog",
  "staggered-list": "Staggered List",
  "text-reveal": "Text Reveal",
} as const satisfies Readonly<Record<PlaygroundComponent, string>>;

const previewItems = [
  { id: "brief", label: "Write the brief", track: "Intent" },
  { id: "prototype", label: "Prototype the motion", track: "Behavior" },
  { id: "verify", label: "Verify accessibility", track: "Release" },
] as const;

function getPreviewItemKey(item: (typeof previewItems)[number]) {
  return item.id;
}

interface RangeControlProps {
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly step: number;
  readonly unit: string;
  readonly value: number;
}

function RangeControl({ label, max, min, onChange, step, unit, value }: RangeControlProps) {
  const inputId = useId();

  return (
    <div className="playground-range">
      <span>
        <label htmlFor={inputId}>{label}</label>
        <output aria-label={`${label} value`} htmlFor={inputId}>
          {value.toString()}
          {unit}
        </output>
      </span>
      <input
        id={inputId}
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
}

interface SegmentedControlProps<Value extends string> {
  readonly label: string;
  readonly onChange: (value: Value) => void;
  readonly options: readonly Value[];
  readonly value: Value;
}

function SegmentedControl<Value extends string>({
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<Value>) {
  return (
    <div className="playground-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          aria-pressed={option === value}
          key={option}
          onClick={() => {
            onChange(option);
          }}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Preview({
  replayKey,
  state,
}: {
  readonly replayKey: number;
  readonly state: PlaygroundState;
}) {
  if (state.component === "staggered-list") {
    const listReplayKey = [
      replayKey,
      state.delay,
      state.distance,
      state.duration,
      state.easing,
      state.order,
      state.preset,
      state.reducedMotion,
      state.stagger,
    ].join(":");

    return (
      <StaggeredList
        as="ol"
        className="playground-list-preview"
        delay={state.delay}
        distance={state.distance}
        duration={state.duration}
        easing={state.easing}
        getKey={getPreviewItemKey}
        interval={state.stagger}
        items={previewItems}
        key={listReplayKey}
        order={state.order}
        preset={state.preset}
      >
        {(item) => (
          <span>
            <strong>{item.label}</strong>
            <small>{item.track}</small>
          </span>
        )}
      </StaggeredList>
    );
  }

  if (state.component === "motion-dialog") {
    return (
      <div className="playground-dialog-launcher" key={replayKey}>
        <span>Overlay behavior</span>
        <strong>Review without losing context.</strong>
        <MotionDialog
          closeClassName="playground-dialog-close"
          contentClassName="playground-dialog-content"
          dismissible={state.dismissible}
          distance={state.distance}
          duration={state.duration}
          easing={state.easing}
          overlayClassName="playground-dialog-overlay"
          title="Motion review"
          trigger={<button type="button">Open review</button>}
        >
          <p>Confirm timing, focus behavior, and reduced-motion fallback before publishing.</p>
          <button className="playground-dialog-action" type="button">
            Approve motion
          </button>
        </MotionDialog>
      </div>
    );
  }

  return (
    <TextReveal
      as="h2"
      className="playground-text-preview"
      delay={state.delay}
      distance={state.distance}
      duration={state.duration}
      easing={state.easing}
      key={replayKey}
      preset={state.preset}
      split={state.split}
      stagger={state.stagger}
    >
      Motion should explain what changed.
    </TextReveal>
  );
}

function ControlSection({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="playground-control-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function PlaygroundWorkbench() {
  const [state, setState] = useState<PlaygroundState>(() => getDefaultPlaygroundState());
  const [replayKey, setReplayKey] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const code = generatePlaygroundCode(state);
  const installCommand = getPlaygroundInstallCommand(state);

  function updateState(patch: Readonly<Record<string, unknown>>) {
    setState((current) => parsePlaygroundState({ ...current, ...patch }));
    setCopyState("idle");
  }

  function selectComponent(component: PlaygroundComponent) {
    startTransition(() => {
      const defaults = getDefaultPlaygroundState(component);
      setState(
        parsePlaygroundState({
          ...defaults,
          contrast: state.contrast,
          reducedMotion: state.reducedMotion,
          viewport: state.viewport,
        }),
      );
      setReplayKey((key) => key + 1);
      setCopyState("idle");
    });
  }

  async function copyCode() {
    try {
      const clipboard = navigator.clipboard as Clipboard | undefined;

      if (!clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <section className="playground-workbench" aria-label="Motion playground">
      <aside className="playground-controls" aria-label="Motion controls">
        <div className="playground-controls-heading">
          <span>Control surface</span>
          <strong>{componentNames[state.component]}</strong>
        </div>

        <ControlSection title="Component">
          <label className="playground-select">
            <span>Preview</span>
            <select
              value={state.component}
              onChange={(event) => {
                selectComponent(event.currentTarget.value as PlaygroundComponent);
              }}
            >
              {playgroundComponents.map((component) => (
                <option key={component} value={component}>
                  {componentNames[component]}
                </option>
              ))}
            </select>
          </label>
        </ControlSection>

        <ControlSection title="Timing">
          <RangeControl
            {...playgroundRanges.duration}
            label="Duration"
            onChange={(duration) => {
              updateState({ duration });
            }}
            unit="ms"
            value={state.duration}
          />
          {state.component !== "motion-dialog" ? (
            <RangeControl
              {...playgroundRanges.delay}
              label="Delay"
              onChange={(delay) => {
                updateState({ delay });
              }}
              unit="ms"
              value={state.delay}
            />
          ) : null}
          <label className="playground-select">
            <span>Easing</span>
            <select
              value={state.easing}
              onChange={(event) => {
                updateState({ easing: event.currentTarget.value });
              }}
            >
              {playgroundEasings.map((easing) => (
                <option key={easing} value={easing}>
                  {easing}
                </option>
              ))}
            </select>
          </label>
          <RangeControl
            {...playgroundRanges.distance}
            label="Distance"
            onChange={(distance) => {
              updateState({ distance });
            }}
            unit="px"
            value={state.distance}
          />
        </ControlSection>

        {state.component !== "motion-dialog" ? (
          <ControlSection title="Sequence">
            <RangeControl
              {...playgroundRanges.stagger}
              label={state.component === "staggered-list" ? "Interval" : "Stagger"}
              onChange={(stagger) => {
                updateState({ stagger });
              }}
              unit="ms"
              value={state.stagger}
            />
            <span className="playground-control-label">Preset</span>
            <SegmentedControl
              label="Motion preset"
              onChange={(preset) => {
                updateState({ preset });
              }}
              options={playgroundPresets}
              value={state.preset}
            />
            {state.component === "text-reveal" ? (
              <>
                <span className="playground-control-label">Split</span>
                <SegmentedControl
                  label="Text split"
                  onChange={(split) => {
                    updateState({ split });
                  }}
                  options={playgroundSplits}
                  value={state.split}
                />
              </>
            ) : (
              <>
                <span className="playground-control-label">Order</span>
                <SegmentedControl
                  label="Stagger order"
                  onChange={(order) => {
                    updateState({ order });
                  }}
                  options={playgroundOrders}
                  value={state.order}
                />
              </>
            )}
          </ControlSection>
        ) : (
          <ControlSection title="Dialog">
            <label className="playground-checkbox">
              <input
                checked={state.dismissible}
                type="checkbox"
                onChange={(event) => {
                  updateState({ dismissible: event.currentTarget.checked });
                }}
              />
              <span>Dismiss with Escape or backdrop</span>
            </label>
          </ControlSection>
        )}

        <ControlSection title="Environment">
          <label className="playground-checkbox">
            <input
              checked={state.reducedMotion}
              type="checkbox"
              onChange={(event) => {
                updateState({ reducedMotion: event.currentTarget.checked });
              }}
            />
            <span>Simulate reduced motion</span>
          </label>
          <span className="playground-control-label">Background</span>
          <div className="playground-swatches" role="group" aria-label="Preview background">
            {playgroundContrasts.map((contrast) => (
              <button
                aria-label={`${contrast} background`}
                aria-pressed={state.contrast === contrast}
                data-contrast={contrast}
                key={contrast}
                onClick={() => {
                  updateState({ contrast });
                }}
                title={`${contrast} background`}
                type="button"
              />
            ))}
          </div>
        </ControlSection>
      </aside>

      <div className="playground-stage-panel">
        <div className="playground-stage-toolbar">
          <div className="playground-viewports" role="group" aria-label="Preview viewport">
            {playgroundViewports.map((viewport) => {
              const Icon =
                viewport === "mobile" ? Smartphone : viewport === "tablet" ? Tablet : Monitor;

              return (
                <button
                  aria-label={`${viewport} viewport`}
                  aria-pressed={state.viewport === viewport}
                  key={viewport}
                  onClick={() => {
                    updateState({ viewport });
                  }}
                  title={`${viewport} viewport`}
                  type="button"
                >
                  <Icon aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <div className="playground-playback">
            <button
              onClick={() => {
                setReplayKey((key) => key + 1);
              }}
              title="Replay preview"
              type="button"
            >
              <Play aria-hidden="true" />
              <span>Replay</span>
            </button>
            <button
              onClick={() => {
                setState(getDefaultPlaygroundState(state.component));
                setReplayKey((key) => key + 1);
                setCopyState("idle");
              }}
              title="Reset controls"
              type="button"
            >
              <RotateCcw aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="playground-canvas" data-contrast={state.contrast}>
          <div className="playground-viewport" data-viewport={state.viewport}>
            <span className="playground-stage-label">
              {componentNames[state.component]} / {state.viewport}
            </span>
            <MotionProvider reducedMotion={state.reducedMotion ? "always" : "never"}>
              <div className="playground-preview-content">
                <Preview replayKey={replayKey} state={state} />
              </div>
            </MotionProvider>
          </div>
        </div>
      </div>

      <aside className="playground-code-panel" aria-label="Generated React code">
        <div className="playground-code-heading">
          <div>
            <span>Generated output</span>
            <strong>Package React</strong>
          </div>
          <button
            aria-label="Copy generated code"
            data-success={copyState === "copied" ? true : undefined}
            onClick={() => {
              void copyCode();
            }}
            title="Copy generated code"
            type="button"
          >
            {copyState === "copied" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </div>
        <div className="playground-install-command">
          <span>Install</span>
          <code>{installCommand}</code>
        </div>
        <pre>
          <code>{code}</code>
        </pre>
        <p
          aria-label="Code copy status"
          aria-live="polite"
          className="playground-copy-status"
          role="status"
        >
          {copyState === "copied"
            ? "Generated code copied."
            : copyState === "error"
              ? "Copy failed. Select the code and copy it manually."
              : ""}
        </p>
      </aside>
    </section>
  );
}
