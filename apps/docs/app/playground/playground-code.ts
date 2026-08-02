import { getInstallCommand, getInstallPlan, type CopySourceFile } from "easecraft-registry";

import {
  playgroundRevealRootMargins,
  type PlaygroundCodeMode,
  type PlaygroundComponent,
  type PlaygroundState,
} from "./playground-state";

export { playgroundCodeModes, type PlaygroundCodeMode } from "./playground-state";

const componentExportNames = {
  "animated-accordion": "AnimatedAccordion",
  "animated-tabs": "AnimatedTabs",
  "filter-grid": "FilterGrid",
  "motion-dialog": "MotionDialog",
  "number-ticker": "NumberTicker",
  "scroll-reveal": "ScrollReveal",
  "staggered-list": "StaggeredList",
  "text-reveal": "TextReveal",
  "toast-stack": "ToastStack",
} as const satisfies Readonly<Record<PlaygroundComponent, string>>;

function reducedMotionMode(state: PlaygroundState): "always" | "never" {
  return state.reducedMotion ? "always" : "never";
}

function localImportPath(file: CopySourceFile): string {
  return `@/${file.destinationPath.replace(/\.[^.]+$/u, "")}`;
}

function getCopySourceFile(state: PlaygroundState, role: "component" | "provider"): CopySourceFile {
  const file = getInstallPlan(state.component, "copy-source").files.find(
    (candidate) =>
      candidate.role === role &&
      (role !== "component" || candidate.destinationPath.endsWith(`/${state.component}.tsx`)),
  );

  if (!file) {
    throw new Error(`Missing ${role} source for ${state.component}`);
  }

  return file;
}

function generateImports(state: PlaygroundState, mode: PlaygroundCodeMode): string {
  const componentName = componentExportNames[state.component];

  if (mode === "copy-source") {
    const componentPath = localImportPath(getCopySourceFile(state, "component"));
    const providerPath = localImportPath(getCopySourceFile(state, "provider"));

    return `import { ${componentName} } from "${componentPath}";
import { MotionProvider } from "${providerPath}";`;
  }

  const tokenType = mode === "token-override" ? ", type MotionTokenOverrides" : "";
  const packageExports =
    state.component === "motion-dialog"
      ? `${componentName}, MotionProvider`
      : `MotionProvider, ${componentName}`;
  return `import { ${packageExports}${tokenType} } from "easecraft";`;
}

function generateTokenOverrides(state: PlaygroundState, mode: PlaygroundCodeMode): string {
  if (mode !== "token-override") {
    return "";
  }

  const groups = [];

  if ("distance" in state) {
    const distanceToken = state.component === "animated-tabs" ? "small" : "medium";
    groups.push(`distance: { ${distanceToken}: ${state.distance.toString()} },`);
  }

  groups.push(`duration: { normal: ${state.duration.toString()} },`);

  if ("stagger" in state) {
    groups.push(`stagger: { normal: ${state.stagger.toString()} },`);
  }

  return `

const motionTokens = {
${groups.map((group) => `  ${group}`).join("\n")}
} satisfies MotionTokenOverrides;`;
}

function providerProps(state: PlaygroundState, mode: PlaygroundCodeMode): string {
  const tokens = mode === "token-override" ? " tokens={motionTokens}" : "";
  return `reducedMotion="${reducedMotionMode(state)}"${tokens}`;
}

function distanceProp(distance: number, mode: PlaygroundCodeMode): string {
  return mode === "token-override" ? '"medium"' : `{${distance.toString()}}`;
}

function durationProp(state: PlaygroundState, mode: PlaygroundCodeMode): string {
  return mode === "token-override" ? '"normal"' : `{${state.duration.toString()}}`;
}

function generateTextRevealCode(
  state: Extract<PlaygroundState, { component: "text-reveal" }>,
  mode: PlaygroundCodeMode,
) {
  const stagger = mode === "token-override" ? '"normal"' : `{${state.stagger.toString()}}`;

  return `${generateImports(state, mode)}${generateTokenOverrides(state, mode)}

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <TextReveal
        delay={${state.delay.toString()}}
        distance=${distanceProp(state.distance, mode)}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        preset="${state.preset}"
        split="${state.split}"
        stagger=${stagger}
      >
        Motion should explain what changed.
      </TextReveal>
    </MotionProvider>
  );
}
`;
}

function generateStaggeredListCode(
  state: Extract<PlaygroundState, { component: "staggered-list" }>,
  mode: PlaygroundCodeMode,
) {
  const interval = mode === "token-override" ? '"normal"' : `{${state.stagger.toString()}}`;

  return `${generateImports(state, mode)}${generateTokenOverrides(state, mode)}

const items = [
  { id: "brief", label: "Write the brief" },
  { id: "prototype", label: "Prototype the motion" },
  { id: "verify", label: "Verify accessibility" },
] as const;

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <StaggeredList
        delay={${state.delay.toString()}}
        distance=${distanceProp(state.distance, mode)}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        getKey={(item) => item.id}
        interval=${interval}
        items={items}
        order="${state.order}"
        preset="${state.preset}"
      >
        {(item) => <span>{item.label}</span>}
      </StaggeredList>
    </MotionProvider>
  );
}
`;
}

function generateMotionDialogCode(
  state: Extract<PlaygroundState, { component: "motion-dialog" }>,
  mode: PlaygroundCodeMode,
) {
  return `${generateImports(state, mode)}${generateTokenOverrides(state, mode)}

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <MotionDialog
        dismissible={${state.dismissible.toString()}}
        distance=${distanceProp(state.distance, mode)}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        title="Motion review"
        trigger={<button type="button">Open review</button>}
      >
        <p>Review the motion before publishing.</p>
      </MotionDialog>
    </MotionProvider>
  );
}
`;
}

function generateNumberTickerCode(
  state: Extract<PlaygroundState, { component: "number-ticker" }>,
  mode: PlaygroundCodeMode,
) {
  return `${generateImports(state, mode)}${generateTokenOverrides(state, mode)}

const integerFormatOptions = { maximumFractionDigits: 0 } satisfies Intl.NumberFormatOptions;

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <NumberTicker
        announce="${state.announce}"
        as="output"
        delay={${state.delay.toString()}}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        formatOptions={integerFormatOptions}
        from={${state.from.toString()}}
        locale={${JSON.stringify(state.locale)}}
        prefix={${JSON.stringify(state.prefix)}}
        suffix={${JSON.stringify(state.suffix)}}
        value={${state.value.toString()}}
      />
    </MotionProvider>
  );
}
`;
}

function generateAnimatedTabsCode(
  state: Extract<PlaygroundState, { component: "animated-tabs" }>,
  mode: PlaygroundCodeMode,
) {
  const distance = mode === "token-override" ? '"small"' : `{${state.distance.toString()}}`;

  return `${generateImports(state, mode)}${generateTokenOverrides(state, mode)}

interface WorkspaceTab {
  readonly disabled?: boolean;
  readonly id: "overview" | "activity" | "permissions" | "metrics";
  readonly label: string;
  readonly metric: string;
  readonly note: string;
}

const workspaceTabs = [
  { id: "overview", label: "Overview", metric: "24", note: "Active motion components" },
  { id: "activity", label: "Activity", metric: "08", note: "Changes this week" },
  { disabled: true, id: "permissions", label: "Permissions", metric: "--", note: "Unavailable" },
  { id: "metrics", label: "Metrics", metric: "98", note: "Accessibility score" },
] satisfies readonly WorkspaceTab[];

function getTabLabel(tab: WorkspaceTab) {
  return tab.label;
}

function getTabValue(tab: WorkspaceTab) {
  return tab.id;
}

function isTabDisabled(tab: WorkspaceTab) {
  return tab.disabled ?? false;
}

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <AnimatedTabs
        aria-label="Workspace views"
        activationMode="${state.activationMode}"
        defaultValue="${state.tab}"
        distance=${distance}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        getLabel={getTabLabel}
        getValue={getTabValue}
        isDisabled={isTabDisabled}
        items={workspaceTabs}
        loop={${state.loop.toString()}}
        orientation="${state.orientation}"
      >
        {(tab) => (
          <div>
            <strong>{tab.metric}</strong>
            <span>{tab.note}</span>
          </div>
        )}
      </AnimatedTabs>
    </MotionProvider>
  );
}
`;
}

function generateAnimatedAccordionCode(
  state: Extract<PlaygroundState, { component: "animated-accordion" }>,
  mode: PlaygroundCodeMode,
) {
  const expansionProps =
    state.accordionMode === "multiple"
      ? `        defaultValue={${JSON.stringify(state.expanded)}}
        mode="multiple"`
      : `        collapsible={${state.collapsible.toString()}}
        defaultValue=${state.expanded[0] ? `"${state.expanded[0]}"` : "{undefined}"}
        mode="single"`;

  return `${generateImports(state, mode)}${generateTokenOverrides(state, mode)}

interface SystemDetail {
  readonly disabled?: boolean;
  readonly id: "lifecycle" | "semantics" | "interruption" | "registry";
  readonly index: string;
  readonly label: string;
  readonly metric: string;
  readonly note: string;
}

const systemDetails = [
  { id: "lifecycle", index: "01", label: "Intrinsic height", metric: "AUTO", note: "Measures rendered content before animating." },
  { id: "semantics", index: "02", label: "Linked semantics", metric: "APG", note: "Keeps triggers and regions correctly linked." },
  { id: "interruption", index: "03", label: "Rapid reversal", metric: "SAFE", note: "Reverses transitions without stale completion." },
  { disabled: true, id: "registry", index: "04", label: "Registry metadata", metric: "NEXT", note: "Unavailable in this preview." },
] satisfies readonly SystemDetail[];

function getDetailLabel(detail: SystemDetail) {
  return detail.index + " / " + detail.label;
}

function getDetailValue(detail: SystemDetail) {
  return detail.id;
}

function isDetailDisabled(detail: SystemDetail) {
  return detail.disabled ?? false;
}

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <AnimatedAccordion
        aria-label="Motion system details"
${expansionProps}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        getLabel={getDetailLabel}
        getValue={getDetailValue}
        isDisabled={isDetailDisabled}
        items={systemDetails}
      >
        {(detail) => <p>{detail.note}</p>}
      </AnimatedAccordion>
    </MotionProvider>
  );
}
`;
}

const toastSourceById = {
  preview: `  {
    description: "The latest component preview is available.",
    id: "preview",
    title: "Preview published",
  },`,
  review: `  {
    action: { altText: "Review accessibility checks", label: "Review" },
    description: "Keyboard verification needs attention.",
    id: "review",
    priority: "assertive",
    title: "Review required",
  },`,
  sync: `  {
    description: "Registry source and metadata now match.",
    id: "sync",
    title: "Registry synchronized",
  },`,
  tokens: `  {
    description: "Semantic motion values were applied.",
    id: "tokens",
    title: "Tokens updated",
  },`,
} as const;

function generateToastStackImports(
  state: Extract<PlaygroundState, { component: "toast-stack" }>,
  mode: PlaygroundCodeMode,
): string {
  if (mode === "copy-source") {
    const componentPath = localImportPath(getCopySourceFile(state, "component"));
    const providerPath = localImportPath(getCopySourceFile(state, "provider"));

    return `import { useState } from "react";

import { ToastStack, type ToastStackItem } from "${componentPath}";
import { MotionProvider } from "${providerPath}";`;
  }

  const tokenType = mode === "token-override" ? "type MotionTokenOverrides, " : "";

  return `import { useState } from "react";

import { MotionProvider, ToastStack, ${tokenType}type ToastStackItem } from "easecraft";`;
}

function generateToastStackCode(
  state: Extract<PlaygroundState, { component: "toast-stack" }>,
  mode: PlaygroundCodeMode,
) {
  const toastSource = state.toasts.map((id) => toastSourceById[id]).join("\n");

  return `${generateToastStackImports(state, mode)}${generateTokenOverrides(state, mode)}

const initialNotifications = [
${toastSource}
] satisfies readonly ToastStackItem[];

export function Example() {
  const [items, setItems] = useState<ToastStackItem[]>(() => [...initialNotifications]);

  return (
    <MotionProvider ${providerProps(state, mode)}>
      <ToastStack
        distance=${distanceProp(state.distance, mode)}
        duration={${state.toastTimeout.toString()}}
        easing="${state.easing}"
        entryDuration=${durationProp(state, mode)}
        items={items}
        limit={${state.toastLimit.toString()}}
        onDismiss={(id) => {
          setItems((current) => current.filter((item) => item.id !== id));
        }}
        swipeDirection="${state.swipeDirection}"
      />
    </MotionProvider>
  );
}
`;
}

function generateFilterGridImports(
  state: Extract<PlaygroundState, { component: "filter-grid" }>,
  mode: PlaygroundCodeMode,
): string {
  if (mode === "copy-source") {
    const componentPath = localImportPath(getCopySourceFile(state, "component"));
    const providerPath = localImportPath(getCopySourceFile(state, "provider"));

    return `import { FilterGrid, type FilterGridFilter } from "${componentPath}";
import { MotionProvider } from "${providerPath}";`;
  }

  const tokenType = mode === "token-override" ? "type MotionTokenOverrides, " : "";
  return `import { FilterGrid, MotionProvider, ${tokenType}type FilterGridFilter } from "easecraft";`;
}

function generateFilterGridCode(
  state: Extract<PlaygroundState, { component: "filter-grid" }>,
  mode: PlaygroundCodeMode,
) {
  const interval = mode === "token-override" ? '"normal"' : `{${state.stagger.toString()}}`;

  return `${generateFilterGridImports(state, mode)}${generateTokenOverrides(state, mode)}

interface GalleryItem {
  readonly category: "component" | "foundation" | "feedback";
  readonly id: number;
  readonly name: string;
  readonly note: string;
}

type GalleryFilter = "all" | GalleryItem["category"] | "archived";

const galleryItems = [
  { category: "foundation", id: 1, name: "Motion", note: "Single-element presets" },
  { category: "foundation", id: 2, name: "Presence", note: "Retained lifecycle" },
  { category: "component", id: 3, name: "Animated Tabs", note: "Keyboard navigation" },
  { category: "component", id: 4, name: "Motion Dialog", note: "Modal focus" },
  { category: "feedback", id: 5, name: "Number Ticker", note: "Numeric feedback" },
  { category: "feedback", id: 6, name: "Toast Stack", note: "Live notifications" },
] satisfies readonly GalleryItem[];

const galleryFilters = [
  { label: "All", matches: () => true, value: "all" },
  { label: "Foundations", matches: (item) => item.category === "foundation", value: "foundation" },
  { label: "Components", matches: (item) => item.category === "component", value: "component" },
  { label: "Feedback", matches: (item) => item.category === "feedback", value: "feedback" },
  { label: "Archived", matches: () => false, value: "archived" },
] satisfies readonly FilterGridFilter<GalleryItem, GalleryFilter>[];

export function Example() {
  return (
    <MotionProvider ${providerProps(state, mode)}>
      <FilterGrid
        controlsLabel="Filter component gallery"
        defaultValue="${state.filter}"
        distance=${distanceProp(state.distance, mode)}
        duration=${durationProp(state, mode)}
        easing="${state.easing}"
        empty="No archived components."
        filters={galleryFilters}
        getKey={(item) => item.id}
        interval=${interval}
        items={galleryItems}
        order="${state.order}"
        preset="${state.preset}"
      >
        {(item, itemState) => (
          <article data-state={itemState}>
            <strong>{item.name}</strong>
            <span>{item.note}</span>
          </article>
        )}
      </FilterGrid>
    </MotionProvider>
  );
}
`;
}

function generateScrollRevealImports(
  state: Extract<PlaygroundState, { component: "scroll-reveal" }>,
  mode: PlaygroundCodeMode,
): string {
  if (mode === "copy-source") {
    const componentPath = localImportPath(getCopySourceFile(state, "component"));
    const providerPath = localImportPath(getCopySourceFile(state, "provider"));

    return `import { useState } from "react";

import { ScrollReveal } from "${componentPath}";
import { MotionProvider } from "${providerPath}";`;
  }

  const tokenType = mode === "token-override" ? ", type MotionTokenOverrides" : "";
  return `import { useState } from "react";

import { MotionProvider, ScrollReveal${tokenType} } from "easecraft";`;
}

function generateScrollRevealCode(
  state: Extract<PlaygroundState, { component: "scroll-reveal" }>,
  mode: PlaygroundCodeMode,
) {
  return `"use client";

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- The bounded overflow region must accept keyboard focus. */

${generateScrollRevealImports(state, mode)}${generateTokenOverrides(state, mode)}

const revealItems = [
  { id: "observe", index: "01", title: "Observe locally", note: "A bounded observer watches this scroll pane." },
  { id: "animate", index: "02", title: "Reveal without shift", note: "Opacity and transforms preserve layout dimensions." },
  { id: "fallback", index: "03", title: "Remain available", note: "Server-rendered content stays readable." },
] as const;

export function Example() {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);

  return (
    <MotionProvider ${providerProps(state, mode)}>
      <div
        aria-label="Scroll Reveal bounded viewport"
        ref={setViewport}
        role="region"
        style={{ maxHeight: 420, overflowY: "auto" }}
        tabIndex={0}
      >
        <header style={{ minHeight: 280 }}>Scroll to reveal</header>
        {revealItems.map((item) => {
          const content = (
            <>
              <span>{item.index}</span>
              <h2>{item.title}</h2>
              <p>{item.note}</p>
            </>
          );

          return viewport ? (
            <ScrollReveal
              as="article"
              delay={${state.delay.toString()}}
              distance=${distanceProp(state.distance, mode)}
              duration=${durationProp(state, mode)}
              easing="${state.easing}"
              key={item.id}
              observerRoot={viewport}
              once={${state.once.toString()}}
              preset="${state.preset}"
              rootMargin="${playgroundRevealRootMargins[state.revealMargin]}"
              threshold={${state.threshold.toString()}}
            >
              {content}
            </ScrollReveal>
          ) : (
            <article key={item.id}>{content}</article>
          );
        })}
      </div>
    </MotionProvider>
  );
}
`;
}

export function generatePlaygroundCode(
  state: PlaygroundState,
  mode: PlaygroundCodeMode = state.codeMode,
): string {
  if (state.component === "scroll-reveal") {
    return generateScrollRevealCode(state, mode);
  }

  if (state.component === "filter-grid") {
    return generateFilterGridCode(state, mode);
  }

  if (state.component === "toast-stack") {
    return generateToastStackCode(state, mode);
  }

  if (state.component === "animated-accordion") {
    return generateAnimatedAccordionCode(state, mode);
  }

  if (state.component === "animated-tabs") {
    return generateAnimatedTabsCode(state, mode);
  }

  if (state.component === "number-ticker") {
    return generateNumberTickerCode(state, mode);
  }

  if (state.component === "staggered-list") {
    return generateStaggeredListCode(state, mode);
  }

  if (state.component === "motion-dialog") {
    return generateMotionDialogCode(state, mode);
  }

  return generateTextRevealCode(state, mode);
}

export function getPlaygroundInstallCommand(
  state: PlaygroundState,
  mode: PlaygroundCodeMode = state.codeMode,
): string {
  return getInstallCommand(
    mode === "copy-source"
      ? getInstallPlan(state.component, "copy-source")
      : getInstallPlan(state.component, "package"),
  );
}
