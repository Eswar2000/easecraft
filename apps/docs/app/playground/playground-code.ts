import { getInstallCommand, getInstallPlan, type CopySourceFile } from "easecraft-registry";

import type { PlaygroundCodeMode, PlaygroundComponent, PlaygroundState } from "./playground-state";

export { playgroundCodeModes, type PlaygroundCodeMode } from "./playground-state";

const componentExportNames = {
  "animated-accordion": "AnimatedAccordion",
  "animated-tabs": "AnimatedTabs",
  "motion-dialog": "MotionDialog",
  "number-ticker": "NumberTicker",
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

export function generatePlaygroundCode(
  state: PlaygroundState,
  mode: PlaygroundCodeMode = state.codeMode,
): string {
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
