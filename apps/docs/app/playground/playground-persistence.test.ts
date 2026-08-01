import { describe, expect, it, vi } from "vitest";

import {
  buildPlaygroundShareUrl,
  createPlaygroundStateStore,
  decodePlaygroundSearchParams,
  decodePlaygroundStorage,
  encodePlaygroundSearchParams,
  playgroundStorageKey,
  resolveInitialPlaygroundState,
  serializePlaygroundStorage,
} from "./playground-persistence";
import { getDefaultPlaygroundState, parsePlaygroundState } from "./playground-state";

describe("playground persistence", () => {
  it("round-trips each component through stable versioned URL fields", () => {
    const states = [
      parsePlaygroundState({
        codeMode: "token-override",
        component: "text-reveal",
        delay: 80,
        duration: 640,
        split: "characters",
      }),
      parsePlaygroundState({
        announce: "assertive",
        component: "number-ticker",
        from: -250,
        locale: "de-DE",
        prefix: "EUR ",
        suffix: " total",
        value: 18_750,
      }),
      parsePlaygroundState({
        component: "staggered-list",
        order: "reverse",
        preset: "rise",
        stagger: 90,
      }),
      parsePlaygroundState({
        component: "motion-dialog",
        dismissible: false,
        reducedMotion: true,
      }),
    ];

    states.forEach((state) => {
      const encoded = encodePlaygroundSearchParams(state);

      expect(encoded.get("v")).toBe("1");
      expect(decodePlaygroundSearchParams(encoded)).toEqual(state);
    });
    const textState = states[0];

    if (!textState) {
      throw new Error("Expected the Text Reveal share state");
    }

    expect(encodePlaygroundSearchParams(textState).toString()).toBe(
      "v=1&component=text-reveal&codeMode=token-override&duration=640&distance=12&easing=enter&reducedMotion=0&viewport=desktop&contrast=paper&delay=80&stagger=60&preset=fade-rise&split=characters",
    );
  });

  it("ignores unsupported versions and clamps malformed URL values", () => {
    expect(decodePlaygroundSearchParams(new URLSearchParams("v=2&duration=600"))).toBeUndefined();
    expect(
      decodePlaygroundSearchParams(
        new URLSearchParams(
          "v=1&component=text-reveal&duration=9999&distance=-4&stagger=bad&split=missing&unknown=value",
        ),
      ),
    ).toEqual({
      ...getDefaultPlaygroundState(),
      distance: 0,
      duration: 1200,
    });
    expect(
      decodePlaygroundSearchParams(
        new URLSearchParams(
          "v=1&component=number-ticker&value=9999999&from=bad&locale=missing&prefix=abcdefghijklmnop&distance=24",
        ),
      ),
    ).toEqual({
      ...getDefaultPlaygroundState("number-ticker"),
      prefix: "abcdefghijkl",
      value: 1_000_000,
    });
  });

  it("validates stored JSON and rejects malformed or unsupported data", () => {
    const state = parsePlaygroundState({ component: "motion-dialog", dismissible: false });

    expect(decodePlaygroundStorage(serializePlaygroundStorage(state))).toEqual(state);
    expect(decodePlaygroundStorage("not json")).toBeUndefined();
    expect(decodePlaygroundStorage('{"version":2,"component":"text-reveal"}')).toBeUndefined();
    expect(playgroundStorageKey).toBe("easecraft:playground:v1");
  });

  it("prefers a valid shared URL over local storage, then falls back to storage", () => {
    const stored = parsePlaygroundState({ component: "staggered-list", order: "reverse" });
    const shared = parsePlaygroundState({ component: "motion-dialog", dismissible: false });

    expect(
      resolveInitialPlaygroundState({
        searchParams: encodePlaygroundSearchParams(shared),
        storedValue: serializePlaygroundStorage(stored),
      }),
    ).toEqual(shared);
    expect(
      resolveInitialPlaygroundState({
        searchParams: new URLSearchParams("v=2"),
        storedValue: serializePlaygroundStorage(stored),
      }),
    ).toEqual(stored);
  });

  it("builds a canonical share URL without unrelated query or hash data", () => {
    const state = parsePlaygroundState({ component: "motion-dialog", dismissible: false });
    const url = new URL(
      buildPlaygroundShareUrl(state, "https://easecraft.dev/old?debug=1#section"),
    );

    expect(url.pathname).toBe("/playground");
    expect(url.hash).toBe("");
    expect(url.searchParams.get("debug")).toBeNull();
    expect(decodePlaygroundSearchParams(url.searchParams)).toEqual(state);
  });

  it("restores and persists validated state through the external store", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const stored = parsePlaygroundState({ component: "staggered-list", stagger: 90 });
    storage.setItem(playgroundStorageKey, serializePlaygroundStorage(stored));
    const store = createPlaygroundStateStore({
      initialState: getDefaultPlaygroundState(),
      restoreFromStorage: true,
      storage,
    });

    expect(store.getServerSnapshot()).toEqual(getDefaultPlaygroundState());
    expect(store.getSnapshot()).toEqual(stored);

    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    const next = parsePlaygroundState({ component: "motion-dialog", dismissible: false });
    store.setState(next);

    expect(listener).toHaveBeenCalledOnce();
    expect(decodePlaygroundStorage(values.get(playgroundStorageKey))).toEqual(next);

    unsubscribe();
    store.setState(getDefaultPlaygroundState());
    expect(listener).toHaveBeenCalledOnce();
  });

  it("gives explicit shared state precedence over persisted storage", () => {
    const stored = getDefaultPlaygroundState("staggered-list");
    const shared = parsePlaygroundState({ component: "motion-dialog", dismissible: false });
    const storage = {
      getItem: () => serializePlaygroundStorage(stored),
      setItem: vi.fn(),
    };
    const store = createPlaygroundStateStore({
      initialState: getDefaultPlaygroundState(),
      restoreFromStorage: true,
      sharedState: shared,
      storage,
    });

    expect(store.getServerSnapshot()).toEqual(getDefaultPlaygroundState());
    expect(store.getSnapshot()).toEqual(shared);
  });
});
