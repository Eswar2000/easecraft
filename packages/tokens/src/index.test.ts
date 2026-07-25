import { describe, expect, it } from "vitest";

import { defaultMotionTokens, resolveMotionTokens, type MotionTokenOverrides } from "./index.js";

describe("defaultMotionTokens", () => {
  it("matches the initial Easecraft motion contract", () => {
    expect(defaultMotionTokens).toEqual({
      duration: {
        instant: 100,
        fast: 180,
        normal: 300,
        slow: 600,
      },
      distance: {
        small: 4,
        medium: 12,
        large: 24,
      },
      stagger: {
        tight: 25,
        normal: 60,
        relaxed: 100,
      },
      easing: {
        enter: "out(3)",
        exit: "in(2)",
        move: "inOut(3)",
        emphasized: "out(5)",
      },
    });
  });
});

describe("resolveMotionTokens", () => {
  it("merges category overrides without dropping defaults", () => {
    const overrides = {
      duration: { normal: 360 },
      easing: { enter: "out(4)" },
    } satisfies MotionTokenOverrides;

    expect(resolveMotionTokens(overrides)).toEqual({
      ...defaultMotionTokens,
      duration: { ...defaultMotionTokens.duration, normal: 360 },
      easing: { ...defaultMotionTokens.easing, enter: "out(4)" },
    });
  });

  it("returns independent category objects", () => {
    const resolvedTokens = resolveMotionTokens();

    expect(resolvedTokens).toEqual(defaultMotionTokens);
    expect(resolvedTokens.duration).not.toBe(defaultMotionTokens.duration);
    expect(resolvedTokens.distance).not.toBe(defaultMotionTokens.distance);
    expect(resolvedTokens.stagger).not.toBe(defaultMotionTokens.stagger);
    expect(resolvedTokens.easing).not.toBe(defaultMotionTokens.easing);
  });
});
