import { defaultMotionTokens, type EasingTokens } from "easecraft-tokens";

export const playgroundComponents = [
  "text-reveal",
  "number-ticker",
  "animated-tabs",
  "animated-accordion",
  "toast-stack",
  "filter-grid",
  "scroll-reveal",
  "staggered-list",
  "motion-dialog",
] as const;
export const playgroundCodeModes = ["package", "copy-source", "token-override"] as const;
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
export const playgroundNumberAnnouncements = ["off", "polite", "assertive"] as const;
export const playgroundNumberLocales = ["en-US", "de-DE", "en-IN"] as const;
export const playgroundTabActivationModes = ["automatic", "manual"] as const;
export const playgroundTabOrientations = ["horizontal", "vertical"] as const;
export const playgroundTabValues = ["overview", "activity", "metrics"] as const;
export const playgroundAccordionModes = ["single", "multiple"] as const;
export const playgroundAccordionValues = ["lifecycle", "semantics", "interruption"] as const;
export const playgroundToastIds = ["preview", "review", "sync", "tokens"] as const;
export const playgroundToastSwipeDirections = ["right", "left", "down", "up"] as const;
export const playgroundGridFilters = [
  "all",
  "foundation",
  "component",
  "feedback",
  "archived",
] as const;
export const playgroundRevealMargins = ["early", "balanced", "late"] as const;
export const playgroundRevealRootMargins = {
  balanced: "0px 0px -10% 0px",
  early: "0px 0px 10% 0px",
  late: "0px 0px -30% 0px",
} as const satisfies Readonly<Record<PlaygroundRevealMargin, string>>;

export type PlaygroundComponent = (typeof playgroundComponents)[number];
export type PlaygroundCodeMode = (typeof playgroundCodeModes)[number];
export type PlaygroundContrast = (typeof playgroundContrasts)[number];
export type PlaygroundEasing = (typeof playgroundEasings)[number];
export type PlaygroundViewport = (typeof playgroundViewports)[number];
export type PlaygroundPreset = (typeof playgroundPresets)[number];
export type PlaygroundSplit = (typeof playgroundSplits)[number];
export type PlaygroundOrder = (typeof playgroundOrders)[number];
export type PlaygroundNumberAnnouncement = (typeof playgroundNumberAnnouncements)[number];
export type PlaygroundNumberLocale = (typeof playgroundNumberLocales)[number];
export type PlaygroundTabActivationMode = (typeof playgroundTabActivationModes)[number];
export type PlaygroundTabOrientation = (typeof playgroundTabOrientations)[number];
export type PlaygroundTabValue = (typeof playgroundTabValues)[number];
export type PlaygroundAccordionMode = (typeof playgroundAccordionModes)[number];
export type PlaygroundAccordionValue = (typeof playgroundAccordionValues)[number];
export type PlaygroundToastId = (typeof playgroundToastIds)[number];
export type PlaygroundToastSwipeDirection = (typeof playgroundToastSwipeDirections)[number];
export type PlaygroundGridFilter = (typeof playgroundGridFilters)[number];
export type PlaygroundRevealMargin = (typeof playgroundRevealMargins)[number];

export interface PlaygroundCommonState {
  readonly codeMode: PlaygroundCodeMode;
  readonly contrast: PlaygroundContrast;
  readonly duration: number;
  readonly easing: PlaygroundEasing;
  readonly reducedMotion: boolean;
  readonly version: 1;
  readonly viewport: PlaygroundViewport;
}

export interface PlaygroundSpatialState extends PlaygroundCommonState {
  readonly distance: number;
}

export interface TextRevealPlaygroundState extends PlaygroundSpatialState {
  readonly component: "text-reveal";
  readonly delay: number;
  readonly preset: PlaygroundPreset;
  readonly split: PlaygroundSplit;
  readonly stagger: number;
}

export interface StaggeredListPlaygroundState extends PlaygroundSpatialState {
  readonly component: "staggered-list";
  readonly delay: number;
  readonly order: PlaygroundOrder;
  readonly preset: PlaygroundPreset;
  readonly stagger: number;
}

export interface MotionDialogPlaygroundState extends PlaygroundSpatialState {
  readonly component: "motion-dialog";
  readonly dismissible: boolean;
}

export interface NumberTickerPlaygroundState extends PlaygroundCommonState {
  readonly announce: PlaygroundNumberAnnouncement;
  readonly component: "number-ticker";
  readonly delay: number;
  readonly from: number;
  readonly locale: PlaygroundNumberLocale;
  readonly prefix: string;
  readonly suffix: string;
  readonly value: number;
}

export interface AnimatedTabsPlaygroundState extends PlaygroundSpatialState {
  readonly activationMode: PlaygroundTabActivationMode;
  readonly component: "animated-tabs";
  readonly loop: boolean;
  readonly orientation: PlaygroundTabOrientation;
  readonly tab: PlaygroundTabValue;
}

export interface AnimatedAccordionPlaygroundState extends PlaygroundCommonState {
  readonly accordionMode: PlaygroundAccordionMode;
  readonly collapsible: boolean;
  readonly component: "animated-accordion";
  readonly expanded: readonly PlaygroundAccordionValue[];
}

export interface ToastStackPlaygroundState extends PlaygroundSpatialState {
  readonly component: "toast-stack";
  readonly swipeDirection: PlaygroundToastSwipeDirection;
  readonly toastLimit: number;
  readonly toastTimeout: number;
  readonly toasts: readonly PlaygroundToastId[];
}

export interface FilterGridPlaygroundState extends PlaygroundSpatialState {
  readonly component: "filter-grid";
  readonly filter: PlaygroundGridFilter;
  readonly order: PlaygroundOrder;
  readonly preset: PlaygroundPreset;
  readonly stagger: number;
}

export interface ScrollRevealPlaygroundState extends PlaygroundSpatialState {
  readonly component: "scroll-reveal";
  readonly delay: number;
  readonly once: boolean;
  readonly preset: PlaygroundPreset;
  readonly revealMargin: PlaygroundRevealMargin;
  readonly threshold: number;
}

export type PlaygroundState =
  | TextRevealPlaygroundState
  | NumberTickerPlaygroundState
  | AnimatedTabsPlaygroundState
  | AnimatedAccordionPlaygroundState
  | ToastStackPlaygroundState
  | FilterGridPlaygroundState
  | ScrollRevealPlaygroundState
  | StaggeredListPlaygroundState
  | MotionDialogPlaygroundState;

export const playgroundRanges = {
  delay: { max: 800, min: 0, step: 20 },
  distance: { max: 48, min: 0, step: 1 },
  duration: { max: 1200, min: 100, step: 20 },
  number: { max: 1_000_000, min: -1_000_000, step: 1 },
  stagger: { max: 200, min: 0, step: 5 },
  threshold: { max: 1, min: 0, step: 0.05 },
  toastLimit: { max: 3, min: 1, step: 1 },
  toastTimeout: { max: 15_000, min: 2_000, step: 1_000 },
} as const;

const commonDefaults = {
  codeMode: "package",
  contrast: "paper",
  duration: defaultMotionTokens.duration.normal,
  easing: "enter",
  reducedMotion: false,
  version: 1,
  viewport: "desktop",
} as const satisfies PlaygroundCommonState;

const spatialDefaults = {
  ...commonDefaults,
  distance: defaultMotionTokens.distance.medium,
} as const satisfies PlaygroundSpatialState;

const componentDefaults = {
  "animated-accordion": {
    ...commonDefaults,
    accordionMode: "single",
    collapsible: true,
    component: "animated-accordion",
    expanded: ["lifecycle"],
  },
  "animated-tabs": {
    ...spatialDefaults,
    activationMode: "automatic",
    component: "animated-tabs",
    distance: defaultMotionTokens.distance.small,
    easing: "move",
    loop: true,
    orientation: "horizontal",
    tab: "overview",
  },
  "filter-grid": {
    ...spatialDefaults,
    component: "filter-grid",
    filter: "all",
    order: "forward",
    preset: "fade-rise",
    stagger: defaultMotionTokens.stagger.normal,
  },
  "motion-dialog": {
    ...spatialDefaults,
    component: "motion-dialog",
    dismissible: true,
  },
  "number-ticker": {
    ...commonDefaults,
    announce: "polite",
    component: "number-ticker",
    delay: 0,
    duration: defaultMotionTokens.duration.slow,
    easing: "move",
    from: 0,
    locale: "en-US",
    prefix: "$",
    suffix: "",
    value: 12_480,
  },
  "scroll-reveal": {
    ...spatialDefaults,
    component: "scroll-reveal",
    delay: 0,
    once: true,
    preset: "fade-rise",
    revealMargin: "balanced",
    threshold: 0.25,
  },
  "staggered-list": {
    ...spatialDefaults,
    component: "staggered-list",
    delay: 0,
    order: "forward",
    preset: "fade-rise",
    stagger: defaultMotionTokens.stagger.normal,
  },
  "toast-stack": {
    ...spatialDefaults,
    component: "toast-stack",
    swipeDirection: "right",
    toastLimit: 2,
    toastTimeout: 10_000,
    toasts: ["preview", "review", "sync"],
  },
  "text-reveal": {
    ...spatialDefaults,
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

function readFraction(
  value: unknown,
  fallback: number,
  range: { readonly max: number; readonly min: number },
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.round(Math.min(range.max, Math.max(range.min, value)) * 100) / 100;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, 12) : fallback;
}

function readEnumArray<const Value extends string>(
  value: unknown,
  values: readonly Value[],
  fallback: readonly Value[],
): Value[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  return value.reduce<Value[]>((result, item) => {
    if (
      typeof item === "string" &&
      values.includes(item as Value) &&
      !result.includes(item as Value)
    ) {
      result.push(item as Value);
    }

    return result;
  }, []);
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
    codeMode: readEnum(input["codeMode"], playgroundCodeModes, defaults.codeMode),
    contrast: readEnum(input["contrast"], playgroundContrasts, defaults.contrast),
    duration: readNumber(input["duration"], defaults.duration, playgroundRanges.duration),
    easing: readEnum(input["easing"], playgroundEasings, defaults.easing),
    reducedMotion: readBoolean(input["reducedMotion"], defaults.reducedMotion),
    version: 1 as const,
    viewport: readEnum(input["viewport"], playgroundViewports, defaults.viewport),
  };

  if (component === "animated-accordion") {
    const accordionDefaults = componentDefaults["animated-accordion"];
    const accordionMode = readEnum(
      input["accordionMode"],
      playgroundAccordionModes,
      accordionDefaults.accordionMode,
    );
    const defaultExpanded =
      accordionMode === "multiple"
        ? (["lifecycle", "semantics"] as const)
        : accordionDefaults.expanded;
    const expanded = readEnumArray(input["expanded"], playgroundAccordionValues, defaultExpanded);

    return {
      ...common,
      accordionMode,
      collapsible: readBoolean(input["collapsible"], accordionDefaults.collapsible),
      component,
      expanded: accordionMode === "single" ? expanded.slice(0, 1) : expanded,
    };
  }

  if (component === "toast-stack") {
    const toastDefaults = componentDefaults["toast-stack"];

    return {
      ...common,
      component,
      distance: readNumber(input["distance"], toastDefaults.distance, playgroundRanges.distance),
      swipeDirection: readEnum(
        input["swipeDirection"],
        playgroundToastSwipeDirections,
        toastDefaults.swipeDirection,
      ),
      toastLimit: readNumber(
        input["toastLimit"],
        toastDefaults.toastLimit,
        playgroundRanges.toastLimit,
      ),
      toastTimeout: readNumber(
        input["toastTimeout"],
        toastDefaults.toastTimeout,
        playgroundRanges.toastTimeout,
      ),
      toasts: readEnumArray(input["toasts"], playgroundToastIds, toastDefaults.toasts),
    };
  }

  if (component === "filter-grid") {
    const gridDefaults = componentDefaults["filter-grid"];

    return {
      ...common,
      component,
      distance: readNumber(input["distance"], gridDefaults.distance, playgroundRanges.distance),
      filter: readEnum(input["filter"], playgroundGridFilters, gridDefaults.filter),
      order: readEnum(input["order"], playgroundOrders, gridDefaults.order),
      preset: readEnum(input["preset"], playgroundPresets, gridDefaults.preset),
      stagger: readNumber(input["stagger"], gridDefaults.stagger, playgroundRanges.stagger),
    };
  }

  if (component === "scroll-reveal") {
    const revealDefaults = componentDefaults["scroll-reveal"];

    return {
      ...common,
      component,
      delay: readNumber(input["delay"], revealDefaults.delay, playgroundRanges.delay),
      distance: readNumber(input["distance"], revealDefaults.distance, playgroundRanges.distance),
      once: readBoolean(input["once"], revealDefaults.once),
      preset: readEnum(input["preset"], playgroundPresets, revealDefaults.preset),
      revealMargin: readEnum(
        input["revealMargin"],
        playgroundRevealMargins,
        revealDefaults.revealMargin,
      ),
      threshold: readFraction(
        input["threshold"],
        revealDefaults.threshold,
        playgroundRanges.threshold,
      ),
    };
  }

  if (component === "animated-tabs") {
    const tabDefaults = componentDefaults["animated-tabs"];

    return {
      ...common,
      activationMode: readEnum(
        input["activationMode"],
        playgroundTabActivationModes,
        tabDefaults.activationMode,
      ),
      component,
      distance: readNumber(input["distance"], tabDefaults.distance, playgroundRanges.distance),
      loop: readBoolean(input["loop"], tabDefaults.loop),
      orientation: readEnum(
        input["orientation"],
        playgroundTabOrientations,
        tabDefaults.orientation,
      ),
      tab: readEnum(input["tab"], playgroundTabValues, tabDefaults.tab),
    };
  }

  if (component === "number-ticker") {
    const numberDefaults = componentDefaults["number-ticker"];

    return {
      ...common,
      announce: readEnum(input["announce"], playgroundNumberAnnouncements, numberDefaults.announce),
      component,
      delay: readNumber(input["delay"], numberDefaults.delay, playgroundRanges.delay),
      from: readNumber(input["from"], numberDefaults.from, playgroundRanges.number),
      locale: readEnum(input["locale"], playgroundNumberLocales, numberDefaults.locale),
      prefix: readString(input["prefix"], numberDefaults.prefix),
      suffix: readString(input["suffix"], numberDefaults.suffix),
      value: readNumber(input["value"], numberDefaults.value, playgroundRanges.number),
    };
  }

  if (component === "staggered-list") {
    const listDefaults = componentDefaults["staggered-list"];

    return {
      ...common,
      component,
      delay: readNumber(input["delay"], listDefaults.delay, playgroundRanges.delay),
      distance: readNumber(input["distance"], listDefaults.distance, playgroundRanges.distance),
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
      distance: readNumber(input["distance"], dialogDefaults.distance, playgroundRanges.distance),
    };
  }

  const textDefaults = componentDefaults["text-reveal"];

  return {
    ...common,
    component,
    delay: readNumber(input["delay"], textDefaults.delay, playgroundRanges.delay),
    distance: readNumber(input["distance"], textDefaults.distance, playgroundRanges.distance),
    preset: readEnum(input["preset"], playgroundPresets, textDefaults.preset),
    split: readEnum(input["split"], playgroundSplits, textDefaults.split),
    stagger: readNumber(input["stagger"], textDefaults.stagger, playgroundRanges.stagger),
  };
}
