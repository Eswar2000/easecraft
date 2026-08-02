import { describe, expect, it } from "vitest";

import {
  getDefaultPlaygroundState,
  parsePlaygroundState,
  playgroundRanges,
} from "./playground-state";

describe("playground state", () => {
  it("creates stable component-specific defaults", () => {
    expect(getDefaultPlaygroundState()).toEqual({
      codeMode: "package",
      component: "text-reveal",
      contrast: "paper",
      delay: 0,
      distance: 12,
      duration: 300,
      easing: "enter",
      preset: "fade-rise",
      reducedMotion: false,
      split: "words",
      stagger: 60,
      version: 1,
      viewport: "desktop",
    });
    expect(getDefaultPlaygroundState("staggered-list")).toMatchObject({
      component: "staggered-list",
      order: "forward",
      preset: "fade-rise",
      stagger: 60,
    });
    expect(getDefaultPlaygroundState("motion-dialog")).toMatchObject({
      component: "motion-dialog",
      dismissible: true,
    });
    expect(getDefaultPlaygroundState("number-ticker")).toMatchObject({
      announce: "polite",
      component: "number-ticker",
      duration: 600,
      easing: "move",
      from: 0,
      locale: "en-US",
      prefix: "$",
      suffix: "",
      value: 12_480,
    });
    expect(getDefaultPlaygroundState("animated-tabs")).toMatchObject({
      activationMode: "automatic",
      component: "animated-tabs",
      distance: 4,
      easing: "move",
      loop: true,
      orientation: "horizontal",
      tab: "overview",
    });
    expect(getDefaultPlaygroundState("animated-accordion")).toMatchObject({
      accordionMode: "single",
      collapsible: true,
      component: "animated-accordion",
      easing: "enter",
      expanded: ["lifecycle"],
    });
    expect(getDefaultPlaygroundState("toast-stack")).toMatchObject({
      component: "toast-stack",
      distance: 12,
      swipeDirection: "right",
      toastLimit: 2,
      toastTimeout: 10_000,
      toasts: ["preview", "review", "sync"],
    });
  });

  it("validates enums, ignores unknown fields, and clamps numeric controls", () => {
    expect(
      parsePlaygroundState({
        codeMode: "token-override",
        component: "text-reveal",
        contrast: "missing",
        delay: -20,
        distance: 500,
        duration: 9999,
        easing: "spring",
        extra: "ignored",
        preset: "rise",
        reducedMotion: true,
        split: "characters",
        stagger: 42.4,
        version: 99,
        viewport: "mobile",
      }),
    ).toEqual({
      codeMode: "token-override",
      component: "text-reveal",
      contrast: "paper",
      delay: playgroundRanges.delay.min,
      distance: playgroundRanges.distance.max,
      duration: playgroundRanges.duration.max,
      easing: "enter",
      preset: "rise",
      reducedMotion: true,
      split: "characters",
      stagger: 42,
      version: 1,
      viewport: "mobile",
    });
  });

  it("falls back safely for malformed or unknown configurations", () => {
    expect(parsePlaygroundState(null)).toEqual(getDefaultPlaygroundState());
    expect(parsePlaygroundState({ component: "unknown" })).toEqual(getDefaultPlaygroundState());
    expect(
      parsePlaygroundState({
        component: "motion-dialog",
        dismissible: "yes",
        duration: Number.NaN,
      }),
    ).toEqual(getDefaultPlaygroundState("motion-dialog"));
  });

  it("returns only fields supported by the selected component", () => {
    const state = parsePlaygroundState({
      component: "motion-dialog",
      dismissible: false,
      order: "reverse",
      split: "characters",
      stagger: 120,
    });

    expect(state).toEqual({
      ...getDefaultPlaygroundState("motion-dialog"),
      dismissible: false,
    });
    expect("delay" in state).toBe(false);
    expect("split" in state).toBe(false);
    expect("stagger" in state).toBe(false);

    const numberState = parsePlaygroundState({
      announce: "assertive",
      component: "number-ticker",
      distance: 24,
      from: -2_000_000,
      locale: "missing",
      prefix: "abcdefghijklmnop",
      stagger: 120,
      value: 2_000_000,
    });

    expect(numberState).toEqual({
      ...getDefaultPlaygroundState("number-ticker"),
      announce: "assertive",
      from: playgroundRanges.number.min,
      prefix: "abcdefghijkl",
      value: playgroundRanges.number.max,
    });
    expect("distance" in numberState).toBe(false);
    expect("stagger" in numberState).toBe(false);

    const tabsState = parsePlaygroundState({
      activationMode: "manual",
      component: "animated-tabs",
      delay: 200,
      distance: 500,
      loop: false,
      orientation: "vertical",
      stagger: 120,
      tab: "permissions",
    });

    expect(tabsState).toEqual({
      ...getDefaultPlaygroundState("animated-tabs"),
      activationMode: "manual",
      distance: playgroundRanges.distance.max,
      loop: false,
      orientation: "vertical",
    });
    expect("delay" in tabsState).toBe(false);
    expect("stagger" in tabsState).toBe(false);

    const accordionState = parsePlaygroundState({
      accordionMode: "multiple",
      collapsible: false,
      component: "animated-accordion",
      distance: 24,
      expanded: ["lifecycle", "registry", "semantics", "lifecycle"],
      stagger: 120,
    });

    expect(accordionState).toEqual({
      ...getDefaultPlaygroundState("animated-accordion"),
      accordionMode: "multiple",
      collapsible: false,
      expanded: ["lifecycle", "semantics"],
    });
    expect("distance" in accordionState).toBe(false);
    expect("stagger" in accordionState).toBe(false);

    expect(
      parsePlaygroundState({
        accordionMode: "single",
        component: "animated-accordion",
        expanded: ["semantics", "interruption"],
      }),
    ).toMatchObject({ expanded: ["semantics"] });

    const toastState = parsePlaygroundState({
      component: "toast-stack",
      delay: 200,
      swipeDirection: "diagonal",
      toastLimit: 99,
      toastTimeout: 500,
      toasts: ["review", "missing", "preview", "review"],
    });

    expect(toastState).toEqual({
      ...getDefaultPlaygroundState("toast-stack"),
      toastLimit: playgroundRanges.toastLimit.max,
      toastTimeout: playgroundRanges.toastTimeout.min,
      toasts: ["review", "preview"],
    });
    expect("delay" in toastState).toBe(false);
    expect("stagger" in toastState).toBe(false);
  });
});
