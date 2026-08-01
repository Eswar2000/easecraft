import { getInstallCommand, getInstallPlan, type CopySourceFile } from "easecraft-registry";

import type { PlaygroundCodeMode, PlaygroundComponent, PlaygroundState } from "./playground-state";

export { playgroundCodeModes, type PlaygroundCodeMode } from "./playground-state";

const componentExportNames = {
  "motion-dialog": "MotionDialog",
  "number-ticker": "NumberTicker",
  "staggered-list": "StaggeredList",
  "text-reveal": "TextReveal",
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
    groups.push(`distance: { medium: ${state.distance.toString()} },`);
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

export function generatePlaygroundCode(
  state: PlaygroundState,
  mode: PlaygroundCodeMode = state.codeMode,
): string {
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
