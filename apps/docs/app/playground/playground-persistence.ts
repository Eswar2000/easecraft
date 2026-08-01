import {
  getDefaultPlaygroundState,
  parsePlaygroundState,
  type PlaygroundState,
} from "./playground-state";

export const playgroundStorageKey = "easecraft:playground:v1";
export const playgroundUrlVersion = "1";

export interface PlaygroundStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
}

export interface PlaygroundStateStore {
  readonly getServerSnapshot: () => PlaygroundState;
  readonly getSnapshot: () => PlaygroundState;
  readonly persist: () => void;
  readonly setState: (state: PlaygroundState) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

export type PlaygroundSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

function firstValue(value: string | readonly string[] | null | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return undefined;
  }

  return value[0];
}

function readSearchValue(
  params: PlaygroundSearchParams | URLSearchParams,
  key: string,
): string | undefined {
  return params instanceof URLSearchParams ? firstValue(params.get(key)) : firstValue(params[key]);
}

function readSearchNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function readSearchBoolean(value: string | undefined): boolean | undefined {
  return value === "1" ? true : value === "0" ? false : undefined;
}

export function decodePlaygroundSearchParams(
  params: PlaygroundSearchParams | URLSearchParams,
): PlaygroundState | undefined {
  if (readSearchValue(params, "v") !== playgroundUrlVersion) {
    return undefined;
  }

  return parsePlaygroundState({
    activationMode: readSearchValue(params, "activationMode"),
    announce: readSearchValue(params, "announce"),
    codeMode: readSearchValue(params, "codeMode"),
    component: readSearchValue(params, "component"),
    contrast: readSearchValue(params, "contrast"),
    delay: readSearchNumber(readSearchValue(params, "delay")),
    dismissible: readSearchBoolean(readSearchValue(params, "dismissible")),
    distance: readSearchNumber(readSearchValue(params, "distance")),
    duration: readSearchNumber(readSearchValue(params, "duration")),
    easing: readSearchValue(params, "easing"),
    from: readSearchNumber(readSearchValue(params, "from")),
    locale: readSearchValue(params, "locale"),
    loop: readSearchBoolean(readSearchValue(params, "loop")),
    order: readSearchValue(params, "order"),
    orientation: readSearchValue(params, "orientation"),
    preset: readSearchValue(params, "preset"),
    prefix: readSearchValue(params, "prefix"),
    reducedMotion: readSearchBoolean(readSearchValue(params, "reducedMotion")),
    split: readSearchValue(params, "split"),
    stagger: readSearchNumber(readSearchValue(params, "stagger")),
    suffix: readSearchValue(params, "suffix"),
    tab: readSearchValue(params, "tab"),
    value: readSearchNumber(readSearchValue(params, "value")),
    viewport: readSearchValue(params, "viewport"),
  });
}

export function encodePlaygroundSearchParams(state: PlaygroundState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("v", playgroundUrlVersion);
  params.set("component", state.component);
  params.set("codeMode", state.codeMode);
  params.set("duration", state.duration.toString());

  if ("distance" in state) {
    params.set("distance", state.distance.toString());
  }

  params.set("easing", state.easing);
  params.set("reducedMotion", state.reducedMotion ? "1" : "0");
  params.set("viewport", state.viewport);
  params.set("contrast", state.contrast);

  if (state.component === "animated-tabs") {
    params.set("activationMode", state.activationMode);
    params.set("orientation", state.orientation);
    params.set("loop", state.loop ? "1" : "0");
    params.set("tab", state.tab);
  } else if (state.component === "number-ticker") {
    params.set("delay", state.delay.toString());
    params.set("from", state.from.toString());
    params.set("value", state.value.toString());
    params.set("locale", state.locale);
    params.set("prefix", state.prefix);
    params.set("suffix", state.suffix);
    params.set("announce", state.announce);
  } else if (state.component === "motion-dialog") {
    params.set("dismissible", state.dismissible ? "1" : "0");
  } else {
    params.set("delay", state.delay.toString());
    params.set("stagger", state.stagger.toString());
    params.set("preset", state.preset);

    if (state.component === "text-reveal") {
      params.set("split", state.split);
    } else {
      params.set("order", state.order);
    }
  }

  return params;
}

export function buildPlaygroundShareUrl(state: PlaygroundState, currentUrl: string): string {
  const url = new URL(currentUrl);
  url.pathname = "/playground";
  url.search = encodePlaygroundSearchParams(state).toString();
  url.hash = "";
  return url.toString();
}

export function serializePlaygroundStorage(state: PlaygroundState): string {
  return JSON.stringify(state);
}

export function decodePlaygroundStorage(
  value: string | null | undefined,
): PlaygroundState | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      parsed.version !== 1
    ) {
      return undefined;
    }

    return parsePlaygroundState(parsed);
  } catch {
    return undefined;
  }
}

export function resolveInitialPlaygroundState({
  searchParams,
  storedValue,
}: {
  readonly searchParams?: PlaygroundSearchParams | URLSearchParams;
  readonly storedValue?: string | null;
}): PlaygroundState {
  return (
    (searchParams ? decodePlaygroundSearchParams(searchParams) : undefined) ??
    decodePlaygroundStorage(storedValue) ??
    getDefaultPlaygroundState()
  );
}

export function createPlaygroundStateStore({
  initialState,
  restoreFromStorage,
  sharedState,
  storage,
}: {
  readonly initialState: PlaygroundState;
  readonly restoreFromStorage: boolean;
  readonly sharedState?: PlaygroundState;
  readonly storage?: PlaygroundStorage;
}): PlaygroundStateStore {
  const serverSnapshot = parsePlaygroundState(initialState);
  let state = sharedState ? parsePlaygroundState(sharedState) : serverSnapshot;
  const listeners = new Set<() => void>();

  if (!sharedState && restoreFromStorage && storage) {
    try {
      state = decodePlaygroundStorage(storage.getItem(playgroundStorageKey)) ?? serverSnapshot;
    } catch {
      state = serverSnapshot;
    }
  }

  function persist() {
    if (!storage) {
      return;
    }

    try {
      storage.setItem(playgroundStorageKey, serializePlaygroundStorage(state));
    } catch {
      // Storage can be unavailable in private or policy-restricted contexts.
    }
  }

  return {
    getServerSnapshot: () => serverSnapshot,
    getSnapshot: () => state,
    persist,
    setState: (nextState) => {
      state = parsePlaygroundState(nextState);
      persist();
      listeners.forEach((listener) => {
        listener();
      });
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
