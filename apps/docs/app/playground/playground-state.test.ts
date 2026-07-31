import { describe, expect, it } from "vitest";

import {
  getDefaultPlaygroundState,
  parsePlaygroundState,
  playgroundRanges,
} from "./playground-state";

describe("playground state", () => {
  it("creates stable component-specific defaults", () => {
    expect(getDefaultPlaygroundState()).toEqual({
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
  });

  it("validates enums, ignores unknown fields, and clamps numeric controls", () => {
    expect(
      parsePlaygroundState({
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
  });
});
