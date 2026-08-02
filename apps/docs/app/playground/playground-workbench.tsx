"use client";

import {
  AnimatedAccordion,
  AnimatedTabs,
  MotionDialog,
  MotionProvider,
  NumberTicker,
  StaggeredList,
  TextReveal,
  ToastStack,
  type ToastStackItem,
} from "easecraft";
import { Check, Copy, Link2, Monitor, Play, RotateCcw, Smartphone, Tablet } from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  generatePlaygroundCode,
  getPlaygroundInstallCommand,
  playgroundCodeModes,
  type PlaygroundCodeMode,
} from "./playground-code";
import {
  buildPlaygroundShareUrl,
  createPlaygroundStateStore,
  decodePlaygroundSearchParams,
} from "./playground-persistence";
import {
  getDefaultPlaygroundState,
  parsePlaygroundState,
  playgroundAccordionModes,
  playgroundComponents,
  playgroundContrasts,
  playgroundEasings,
  playgroundNumberAnnouncements,
  playgroundNumberLocales,
  playgroundOrders,
  playgroundPresets,
  playgroundRanges,
  playgroundSplits,
  playgroundTabActivationModes,
  playgroundTabOrientations,
  playgroundTabValues,
  playgroundToastSwipeDirections,
  playgroundViewports,
  type PlaygroundComponent,
  type PlaygroundAccordionValue,
  type PlaygroundState,
  type PlaygroundTabValue,
  type PlaygroundToastId,
} from "./playground-state";

const componentNames = {
  "animated-accordion": "Animated Accordion",
  "animated-tabs": "Animated Tabs",
  "motion-dialog": "Motion Dialog",
  "number-ticker": "Number Ticker",
  "staggered-list": "Staggered List",
  "text-reveal": "Text Reveal",
  "toast-stack": "Toast Stack",
} as const satisfies Readonly<Record<PlaygroundComponent, string>>;

const accordionModeNames = {
  multiple: "Multiple",
  single: "Single",
} as const;

const numberAnnouncementNames = {
  assertive: "Assertive",
  off: "Off",
  polite: "Polite",
} as const;

const numberLocaleNames = {
  "de-DE": "Deutsch",
  "en-IN": "English (India)",
  "en-US": "English (US)",
} as const;

const tabActivationNames = {
  automatic: "Automatic",
  manual: "Manual",
} as const;

const tabOrientationNames = {
  horizontal: "Horizontal",
  vertical: "Vertical",
} as const;

const tabValueNames = {
  activity: "Activity",
  metrics: "Metrics",
  overview: "Overview",
} as const;

const toastSwipeDirectionNames = {
  down: "Down",
  left: "Left",
  right: "Right",
  up: "Up",
} as const;

const codeModeNames = {
  "copy-source": "Copy source",
  package: "Package React",
  "token-override": "Token overrides",
} as const satisfies Readonly<Record<PlaygroundCodeMode, string>>;

const previewItems = [
  { id: "brief", label: "Write the brief", track: "Intent" },
  { id: "prototype", label: "Prototype the motion", track: "Behavior" },
  { id: "verify", label: "Verify accessibility", track: "Release" },
] as const;

const playgroundToastCatalog = {
  preview: {
    description: "The latest component preview is available.",
    id: "preview",
    title: "Preview published",
  },
  review: {
    action: { altText: "Review accessibility checks", label: "Review" },
    description: "Keyboard verification needs attention.",
    id: "review",
    priority: "assertive",
    title: "Review required",
  },
  sync: {
    description: "Registry source and metadata now match.",
    id: "sync",
    title: "Registry synchronized",
  },
  tokens: {
    description: "Semantic motion values were applied.",
    id: "tokens",
    title: "Tokens updated",
  },
} as const satisfies Readonly<Record<PlaygroundToastId, ToastStackItem<PlaygroundToastId>>>;

const playgroundToastViewportStyle = {
  maxWidth: "calc(100% - 32px)",
  position: "absolute",
  right: 16,
  top: 52,
  width: 330,
} as const satisfies CSSProperties;

interface PlaygroundDetail {
  readonly disabled?: boolean;
  readonly id: "lifecycle" | "semantics" | "interruption" | "registry";
  readonly index: string;
  readonly label: string;
  readonly metric: string;
  readonly note: string;
}

const playgroundDetails = [
  {
    id: "lifecycle",
    index: "01",
    label: "Intrinsic height",
    metric: "AUTO",
    note: "Measures rendered content before animating to its exact height.",
  },
  {
    id: "semantics",
    index: "02",
    label: "Linked semantics",
    metric: "APG",
    note: "Keeps every trigger and region correctly linked in every state.",
  },
  {
    id: "interruption",
    index: "03",
    label: "Rapid reversal",
    metric: "SAFE",
    note: "Reverses opening and closing without accepting stale completions.",
  },
  {
    disabled: true,
    id: "registry",
    index: "04",
    label: "Registry metadata",
    metric: "NEXT",
    note: "Unavailable in this preview.",
  },
] satisfies readonly PlaygroundDetail[];

interface PlaygroundWorkspaceTab {
  readonly disabled?: boolean;
  readonly id: "overview" | "activity" | "permissions" | "metrics";
  readonly label: string;
  readonly metric: string;
  readonly note: string;
}

const workspaceTabs = [
  { id: "overview", label: "Overview", metric: "24", note: "Active motion components" },
  { id: "activity", label: "Activity", metric: "08", note: "Changes this week" },
  {
    disabled: true,
    id: "permissions",
    label: "Permissions",
    metric: "--",
    note: "Unavailable in preview",
  },
  { id: "metrics", label: "Metrics", metric: "98", note: "Accessibility score" },
] satisfies readonly PlaygroundWorkspaceTab[];

const integerFormatOptions = { maximumFractionDigits: 0 } satisfies Intl.NumberFormatOptions;

function getPreviewItemKey(item: (typeof previewItems)[number]) {
  return item.id;
}

function getDetailLabel(detail: PlaygroundDetail) {
  return (
    <>
      <span>{detail.index}</span>
      <strong>{detail.label}</strong>
      <small>{detail.metric}</small>
    </>
  );
}

function getDetailValue(detail: PlaygroundDetail) {
  return detail.id;
}

function isDetailDisabled(detail: PlaygroundDetail) {
  return detail.disabled ?? false;
}

function renderDetail(detail: PlaygroundDetail) {
  return (
    <div className="playground-accordion-panel">
      <p>{detail.note}</p>
      <dl>
        <div>
          <dt>State</dt>
          <dd>Retained</dd>
        </div>
        <div>
          <dt>Cleanup</dt>
          <dd>Scoped</dd>
        </div>
      </dl>
    </div>
  );
}

function getWorkspaceTabLabel(tab: PlaygroundWorkspaceTab) {
  return tab.label;
}

function getWorkspaceTabValue(tab: PlaygroundWorkspaceTab) {
  return tab.id;
}

function isWorkspaceTabDisabled(tab: PlaygroundWorkspaceTab) {
  return tab.disabled ?? false;
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

interface NumberControlProps {
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly step: number;
  readonly value: number;
}

function NumberControl({ label, max, min, onChange, step, value }: NumberControlProps) {
  return (
    <label className="playground-input">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = event.currentTarget.valueAsNumber;

          if (Number.isFinite(nextValue)) {
            onChange(nextValue);
          }
        }}
      />
    </label>
  );
}

function TextControl({
  label,
  onChange,
  value,
}: {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}) {
  return (
    <label className="playground-input">
      <span>{label}</span>
      <input
        maxLength={12}
        type="text"
        value={value}
        onChange={(event) => {
          onChange(event.currentTarget.value);
        }}
      />
    </label>
  );
}

interface SegmentedControlProps<Value extends string> {
  readonly getOptionLabel?: (value: Value) => string;
  readonly label: string;
  readonly onChange: (value: Value) => void;
  readonly options: readonly Value[];
  readonly value: Value;
}

function SegmentedControl<Value extends string>({
  getOptionLabel = (option) => option,
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
          {getOptionLabel(option)}
        </button>
      ))}
    </div>
  );
}

function Preview({
  onAccordionChange,
  onTabChange,
  onToastChange,
  replayKey,
  state,
}: {
  readonly onAccordionChange: (expanded: readonly PlaygroundAccordionValue[]) => void;
  readonly onTabChange: (tab: PlaygroundTabValue) => void;
  readonly onToastChange: (toasts: readonly PlaygroundToastId[]) => void;
  readonly replayKey: number;
  readonly state: PlaygroundState;
}) {
  if (state.component === "toast-stack") {
    const currentToasts = state.toasts;
    const toastItems = currentToasts.map((id) => playgroundToastCatalog[id]);
    const queuedCount = Math.max(0, toastItems.length - state.toastLimit);

    function addToasts(ids: readonly PlaygroundToastId[]) {
      const next = [...currentToasts];

      ids.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      onToastChange(next);
    }

    return (
      <div className="playground-toast-preview">
        <div className="playground-toast-launch">
          <span
            aria-label="Notification queue status"
            aria-live="polite"
            className="playground-toast-status"
            role="status"
          >
            {toastItems.length} active / {queuedCount} queued
          </span>
          <strong>Notification controls</strong>
          <p>Hover or focus the stack to pause its auto-dismiss timer.</p>
          <div className="playground-toast-actions">
            <button
              onClick={() => {
                const polite = (["preview", "sync", "tokens"] as const).find(
                  (id) => !currentToasts.includes(id),
                );

                if (polite) {
                  addToasts([polite]);
                }
              }}
              type="button"
            >
              Add polite
            </button>
            <button
              onClick={() => {
                addToasts(["review"]);
              }}
              type="button"
            >
              Add assertive
            </button>
            <button
              onClick={() => {
                addToasts(["preview", "review", "sync", "tokens"]);
              }}
              type="button"
            >
              Add burst
            </button>
            <button
              onClick={() => {
                onToastChange([]);
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
        <ToastStack
          actionClassName="playground-toast-action"
          closeClassName="playground-toast-close"
          contentClassName="playground-toast-content"
          distance={state.distance}
          duration={state.toastTimeout}
          easing={state.easing}
          entryDuration={state.duration}
          items={toastItems}
          key={replayKey}
          limit={state.toastLimit}
          onDismiss={(id) => {
            onToastChange(currentToasts.filter((toastId) => toastId !== id));
          }}
          swipeDirection={state.swipeDirection}
          viewportClassName="playground-toast-viewport"
          viewportStyle={playgroundToastViewportStyle}
        />
      </div>
    );
  }

  if (state.component === "animated-accordion") {
    const accordionReplayKey = [replayKey, state.accordionMode, state.reducedMotion].join(":");
    const commonProps = {
      "aria-label": "Motion system details",
      bodyClassName: "playground-accordion-body",
      className: "playground-accordion-preview",
      contentClassName: "playground-accordion-content",
      duration: state.duration,
      easing: state.easing,
      getLabel: getDetailLabel,
      getValue: getDetailValue,
      headerClassName: "playground-accordion-header",
      isDisabled: isDetailDisabled,
      itemClassName: "playground-accordion-item",
      items: playgroundDetails,
      triggerClassName: "playground-accordion-trigger",
    } as const;

    return state.accordionMode === "multiple" ? (
      <AnimatedAccordion<PlaygroundDetail, PlaygroundDetail["id"]>
        key={accordionReplayKey}
        {...commonProps}
        mode="multiple"
        onValueChange={(expanded) => {
          onAccordionChange(
            expanded.filter((value): value is PlaygroundAccordionValue => value !== "registry"),
          );
        }}
        value={state.expanded}
      >
        {renderDetail}
      </AnimatedAccordion>
    ) : (
      <AnimatedAccordion<PlaygroundDetail, PlaygroundDetail["id"]>
        key={accordionReplayKey}
        {...commonProps}
        collapsible={state.collapsible}
        mode="single"
        onValueChange={(expanded) => {
          onAccordionChange(expanded && expanded !== "registry" ? [expanded] : []);
        }}
        value={state.expanded[0]}
      >
        {renderDetail}
      </AnimatedAccordion>
    );
  }

  if (state.component === "animated-tabs") {
    const tabsReplayKey = [replayKey, state.orientation, state.reducedMotion].join(":");

    return (
      <AnimatedTabs
        aria-label="Workspace views"
        activationMode={state.activationMode}
        className="playground-tabs-preview"
        distance={state.distance}
        duration={state.duration}
        easing={state.easing}
        getLabel={getWorkspaceTabLabel}
        getValue={getWorkspaceTabValue}
        isDisabled={isWorkspaceTabDisabled}
        items={workspaceTabs}
        key={tabsReplayKey}
        loop={state.loop}
        onValueChange={(tab) => {
          if (tab !== "permissions") {
            onTabChange(tab);
          }
        }}
        orientation={state.orientation}
        value={state.tab}
      >
        {(tab) => (
          <div className="playground-tabs-panel">
            <div>
              <span>Selected / {tab.label}</span>
              <strong>{tab.metric}</strong>
              <p>{tab.note}</p>
            </div>
            <dl>
              <div>
                <dt>Keyboard</dt>
                <dd>{state.activationMode}</dd>
              </div>
              <div>
                <dt>Motion</dt>
                <dd>{state.reducedMotion ? "Reduced" : "Enabled"}</dd>
              </div>
            </dl>
          </div>
        )}
      </AnimatedTabs>
    );
  }

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

  if (state.component === "number-ticker") {
    const tickerReplayKey = [
      replayKey,
      state.delay,
      state.duration,
      state.easing,
      state.from,
      state.reducedMotion,
    ].join(":");

    return (
      <div className="playground-number-preview">
        <span>Revenue / {state.locale}</span>
        <NumberTicker
          announce={state.announce}
          as="output"
          className="playground-number-value"
          delay={state.delay}
          duration={state.duration}
          easing={state.easing}
          formatOptions={integerFormatOptions}
          from={state.from}
          key={tickerReplayKey}
          locale={state.locale}
          prefix={state.prefix}
          suffix={state.suffix}
          value={state.value}
        />
        <small>FY 2026 projected revenue</small>
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

interface PlaygroundWorkbenchProps {
  readonly initialState?: PlaygroundState;
  readonly restoreFromStorage?: boolean;
}

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getBrowserSharedState(): PlaygroundState | undefined {
  return typeof window === "undefined"
    ? undefined
    : decodePlaygroundSearchParams(new URLSearchParams(window.location.search));
}

export function PlaygroundWorkbench({
  initialState = getDefaultPlaygroundState(),
  restoreFromStorage = true,
}: PlaygroundWorkbenchProps = {}) {
  const [store] = useState(() => {
    const storage = getBrowserStorage();
    const sharedState = getBrowserSharedState();

    return createPlaygroundStateStore({
      initialState,
      restoreFromStorage: sharedState === undefined && restoreFromStorage,
      ...(sharedState ? { sharedState } : {}),
      ...(storage ? { storage } : {}),
    });
  });
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [replayKey, setReplayKey] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "code-copied" | "link-copied" | "error">(
    "idle",
  );
  const code = generatePlaygroundCode(state);
  const installCommand = getPlaygroundInstallCommand(state);

  useEffect(() => {
    store.persist();
  }, [store]);

  function commitState(nextState: PlaygroundState) {
    store.setState(nextState);

    if (
      typeof window !== "undefined" &&
      decodePlaygroundSearchParams(new URLSearchParams(window.location.search)) !== undefined
    ) {
      window.history.replaceState(
        null,
        "",
        buildPlaygroundShareUrl(nextState, window.location.href),
      );
    }
  }

  function updateState(patch: Readonly<Record<string, unknown>>) {
    commitState(parsePlaygroundState({ ...state, ...patch }));
    setCopyState("idle");
  }

  function selectComponent(component: PlaygroundComponent) {
    const defaults = getDefaultPlaygroundState(component);
    commitState(
      parsePlaygroundState({
        ...defaults,
        codeMode: state.codeMode,
        contrast: state.contrast,
        reducedMotion: state.reducedMotion,
        viewport: state.viewport,
      }),
    );
    setReplayKey((key) => key + 1);
    setCopyState("idle");
  }

  async function copyCode() {
    try {
      const clipboard = navigator.clipboard as Clipboard | undefined;

      if (!clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await clipboard.writeText(code);
      setCopyState("code-copied");
    } catch {
      setCopyState("error");
    }
  }

  async function copyShareLink() {
    try {
      const clipboard = navigator.clipboard as Clipboard | undefined;

      if (!clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      const shareUrl = buildPlaygroundShareUrl(state, window.location.href);
      window.history.replaceState(null, "", shareUrl);
      await clipboard.writeText(shareUrl);
      setCopyState("link-copied");
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
          {"delay" in state ? (
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
          {"distance" in state ? (
            <RangeControl
              {...playgroundRanges.distance}
              label="Distance"
              onChange={(distance) => {
                updateState({ distance });
              }}
              unit="px"
              value={state.distance}
            />
          ) : null}
        </ControlSection>

        {state.component === "toast-stack" ? (
          <ControlSection title="Notifications">
            <RangeControl
              {...playgroundRanges.toastLimit}
              label="Visible limit"
              onChange={(toastLimit) => {
                updateState({ toastLimit });
              }}
              unit=""
              value={state.toastLimit}
            />
            <RangeControl
              {...playgroundRanges.toastTimeout}
              label="Auto-dismiss"
              onChange={(toastTimeout) => {
                updateState({ toastTimeout });
              }}
              unit="ms"
              value={state.toastTimeout}
            />
            <label className="playground-select">
              <span>Swipe direction</span>
              <select
                value={state.swipeDirection}
                onChange={(event) => {
                  updateState({ swipeDirection: event.currentTarget.value });
                }}
              >
                {playgroundToastSwipeDirections.map((direction) => (
                  <option key={direction} value={direction}>
                    {toastSwipeDirectionNames[direction]}
                  </option>
                ))}
              </select>
            </label>
          </ControlSection>
        ) : state.component === "animated-accordion" ? (
          <ControlSection title="Accordion">
            <span className="playground-control-label">Expansion</span>
            <SegmentedControl
              getOptionLabel={(mode) => accordionModeNames[mode]}
              label="Accordion expansion"
              onChange={(accordionMode) => {
                updateState({ accordionMode });
              }}
              options={playgroundAccordionModes}
              value={state.accordionMode}
            />
            <label className="playground-checkbox">
              <input
                checked={state.collapsible}
                disabled={state.accordionMode === "multiple"}
                type="checkbox"
                onChange={(event) => {
                  updateState({ collapsible: event.currentTarget.checked });
                }}
              />
              <span>Allow all panels to close</span>
            </label>
          </ControlSection>
        ) : state.component === "animated-tabs" ? (
          <ControlSection title="Tabs">
            <label className="playground-select">
              <span>Active tab</span>
              <select
                value={state.tab}
                onChange={(event) => {
                  updateState({ tab: event.currentTarget.value });
                }}
              >
                {playgroundTabValues.map((tab) => (
                  <option key={tab} value={tab}>
                    {tabValueNames[tab]}
                  </option>
                ))}
              </select>
            </label>
            <span className="playground-control-label">Activation</span>
            <SegmentedControl
              getOptionLabel={(mode) => tabActivationNames[mode]}
              label="Tab activation"
              onChange={(activationMode) => {
                updateState({ activationMode });
              }}
              options={playgroundTabActivationModes}
              value={state.activationMode}
            />
            <span className="playground-control-label">Orientation</span>
            <SegmentedControl
              getOptionLabel={(orientation) => tabOrientationNames[orientation]}
              label="Tab orientation"
              onChange={(orientation) => {
                updateState({ orientation });
              }}
              options={playgroundTabOrientations}
              value={state.orientation}
            />
            <label className="playground-checkbox">
              <input
                checked={state.loop}
                type="checkbox"
                onChange={(event) => {
                  updateState({ loop: event.currentTarget.checked });
                }}
              />
              <span>Loop keyboard navigation</span>
            </label>
          </ControlSection>
        ) : state.component === "number-ticker" ? (
          <ControlSection title="Value">
            <div className="playground-input-grid">
              <NumberControl
                {...playgroundRanges.number}
                label="Target value"
                onChange={(value) => {
                  updateState({ value });
                }}
                value={state.value}
              />
              <NumberControl
                {...playgroundRanges.number}
                label="Start value"
                onChange={(from) => {
                  updateState({ from });
                }}
                value={state.from}
              />
            </div>
            <div className="playground-input-grid">
              <TextControl
                label="Prefix"
                onChange={(prefix) => {
                  updateState({ prefix });
                }}
                value={state.prefix}
              />
              <TextControl
                label="Suffix"
                onChange={(suffix) => {
                  updateState({ suffix });
                }}
                value={state.suffix}
              />
            </div>
            <label className="playground-select">
              <span>Locale</span>
              <select
                value={state.locale}
                onChange={(event) => {
                  updateState({ locale: event.currentTarget.value });
                }}
              >
                {playgroundNumberLocales.map((locale) => (
                  <option key={locale} value={locale}>
                    {numberLocaleNames[locale]}
                  </option>
                ))}
              </select>
            </label>
            <span className="playground-control-label">Announcement</span>
            <SegmentedControl
              getOptionLabel={(announcement) => numberAnnouncementNames[announcement]}
              label="Live announcement"
              onChange={(announce) => {
                updateState({ announce });
              }}
              options={playgroundNumberAnnouncements}
              value={state.announce}
            />
          </ControlSection>
        ) : state.component !== "motion-dialog" ? (
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
              data-success={copyState === "link-copied" ? true : undefined}
              onClick={() => {
                void copyShareLink();
              }}
              title="Copy share link"
              type="button"
            >
              {copyState === "link-copied" ? (
                <Check aria-hidden="true" />
              ) : (
                <Link2 aria-hidden="true" />
              )}
              <span>Share</span>
            </button>
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
                commitState(getDefaultPlaygroundState(state.component));
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
          <div
            className="playground-viewport"
            data-component={state.component}
            data-viewport={state.viewport}
          >
            <span className="playground-stage-label">
              {componentNames[state.component]} / {state.viewport}
            </span>
            <MotionProvider reducedMotion={state.reducedMotion ? "always" : "never"}>
              <div className="playground-preview-content">
                <Preview
                  onAccordionChange={(expanded) => {
                    updateState({ expanded });
                  }}
                  onTabChange={(tab) => {
                    updateState({ tab });
                  }}
                  onToastChange={(toasts) => {
                    updateState({ toasts });
                  }}
                  replayKey={replayKey}
                  state={state}
                />
              </div>
            </MotionProvider>
          </div>
        </div>
      </div>

      <aside className="playground-code-panel" aria-label="Generated React code">
        <div className="playground-code-heading">
          <div>
            <span>Generated output</span>
            <strong>{codeModeNames[state.codeMode]}</strong>
          </div>
          <button
            aria-label="Copy generated code"
            data-success={copyState === "code-copied" ? true : undefined}
            onClick={() => {
              void copyCode();
            }}
            title="Copy generated code"
            type="button"
          >
            {copyState === "code-copied" ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="playground-code-modes">
          <SegmentedControl
            getOptionLabel={(mode) => codeModeNames[mode]}
            label="Code template"
            onChange={(mode) => {
              updateState({ codeMode: mode });
            }}
            options={playgroundCodeModes}
            value={state.codeMode}
          />
        </div>
        <div className="playground-install-command">
          <span>{state.codeMode === "copy-source" ? "Dependencies" : "Install"}</span>
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
          {copyState === "code-copied"
            ? "Generated code copied."
            : copyState === "link-copied"
              ? "Share link copied."
              : copyState === "error"
                ? "Copy failed. Select the code and copy it manually."
                : ""}
        </p>
      </aside>
    </section>
  );
}
