import { defaultMotionTokens, type EasingTokens } from "easecraft-tokens";

export const playgroundComponents = ["text-reveal", "staggered-list", "motion-dialog"] as const;
export const playgroundContrasts = ["paper", "ink", "signal"] as const;
export const playgroundEasings = [
  "enter",
  "exit",
  "move",
  "emphasized",
] as const satisfies readonly (keyof EasingTokens)[];
export const playgroundViewports = ["mobile", "tablet", "desktop"] as const;
export const playgroundPresets = ["fade", "rise", "fade-rise"] as const;
export const playgroundSplits = ["lines", "words", "characters"] as const;
export const playgroundOrders = ["forward", "reverse"] as const;

export type PlaygroundComponent = (typeof playgroundComponents)[number];
export type PlaygroundContrast = (typeof playgroundContrasts)[number];
export type PlaygroundEasing = (typeof playgroundEasings)[number];
export type PlaygroundViewport = (typeof playgroundViewports)[number];
export type PlaygroundPreset = (typeof playgroundPresets)[number];
export type PlaygroundSplit = (typeof playgroundSplits)[number];
export type PlaygroundOrder = (typeof playgroundOrders)[number];

export interface PlaygroundCommonState {
  readonly contrast: PlaygroundContrast;
  readonly distance: number;
  readonly duration: number;
  readonly easing: PlaygroundEasing;
  readonly reducedMotion: boolean;
  readonly version: 1;
  readonly viewport: PlaygroundViewport;
}

export interface TextRevealPlaygroundState extends PlaygroundCommonState {
  readonly component: "text-reveal";
  readonly delay: number;
  readonly preset: PlaygroundPreset;
  readonly split: PlaygroundSplit;
  readonly stagger: number;
}

export interface StaggeredListPlaygroundState extends PlaygroundCommonState {
  readonly component: "staggered-list";
  readonly delay: number;
  readonly order: PlaygroundOrder;
  readonly preset: PlaygroundPreset;
  readonly stagger: number;
}

export interface MotionDialogPlaygroundState extends PlaygroundCommonState {
  readonly component: "motion-dialog";
  readonly dismissible: boolean;
}

export type PlaygroundState =
  TextRevealPlaygroundState | StaggeredListPlaygroundState | MotionDialogPlaygroundState;

export const playgroundRanges = {
  delay: { max: 800, min: 0, step: 20 },
  distance: { max: 48, min: 0, step: 1 },
  duration: { max: 1200, min: 100, step: 20 },
  stagger: { max: 200, min: 0, step: 5 },
} as const;

const commonDefaults = {
  contrast: "paper",
  distance: defaultMotionTokens.distance.medium,
  duration: defaultMotionTokens.duration.normal,
  easing: "enter",
  reducedMotion: false,
  version: 1,
  viewport: "desktop",
} as const satisfies PlaygroundCommonState;

const componentDefaults = {
  "motion-dialog": {
    ...commonDefaults,
    component: "motion-dialog",
    dismissible: true,
  },
  "staggered-list": {
    ...commonDefaults,
    component: "staggered-list",
    delay: 0,
    order: "forward",
    preset: "fade-rise",
    stagger: defaultMotionTokens.stagger.normal,
  },
  "text-reveal": {
    ...commonDefaults,
    component: "text-reveal",
    delay: 0,
    preset: "fade-rise",
    split: "words",
    stagger: defaultMotionTokens.stagger.normal,
  },
} as const satisfies Readonly<Record<PlaygroundComponent, PlaygroundState>>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEnum<const Value extends string>(
  value: unknown,
  values: readonly Value[],
  fallback: Value,
): Value {
  return typeof value === "string" && values.includes(value as Value) ? (value as Value) : fallback;
}

function readNumber(
  value: unknown,
  fallback: number,
  range: { readonly max: number; readonly min: number },
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.round(Math.min(range.max, Math.max(range.min, value)));
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function getDefaultPlaygroundState(
  component: PlaygroundComponent = "text-reveal",
): PlaygroundState {
  return { ...componentDefaults[component] };
}

export function parsePlaygroundState(value: unknown): PlaygroundState {
  const input = isRecord(value) ? value : {};
  const component = readEnum(input["component"], playgroundComponents, "text-reveal");
  const defaults = componentDefaults[component];
  const common = {
    contrast: readEnum(input["contrast"], playgroundContrasts, defaults.contrast),
    distance: readNumber(input["distance"], defaults.distance, playgroundRanges.distance),
    duration: readNumber(input["duration"], defaults.duration, playgroundRanges.duration),
    easing: readEnum(input["easing"], playgroundEasings, defaults.easing),
    reducedMotion: readBoolean(input["reducedMotion"], defaults.reducedMotion),
    version: 1 as const,
    viewport: readEnum(input["viewport"], playgroundViewports, defaults.viewport),
  };

  if (component === "staggered-list") {
    const listDefaults = componentDefaults["staggered-list"];

    return {
      ...common,
      component,
      delay: readNumber(input["delay"], listDefaults.delay, playgroundRanges.delay),
      order: readEnum(input["order"], playgroundOrders, listDefaults.order),
      preset: readEnum(input["preset"], playgroundPresets, listDefaults.preset),
      stagger: readNumber(input["stagger"], listDefaults.stagger, playgroundRanges.stagger),
    };
  }

  if (component === "motion-dialog") {
    const dialogDefaults = componentDefaults["motion-dialog"];

    return {
      ...common,
      component,
      dismissible: readBoolean(input["dismissible"], dialogDefaults.dismissible),
    };
  }

  const textDefaults = componentDefaults["text-reveal"];

  return {
    ...common,
    component,
    delay: readNumber(input["delay"], textDefaults.delay, playgroundRanges.delay),
    preset: readEnum(input["preset"], playgroundPresets, textDefaults.preset),
    split: readEnum(input["split"], playgroundSplits, textDefaults.split),
    stagger: readNumber(input["stagger"], textDefaults.stagger, playgroundRanges.stagger),
  };
}
