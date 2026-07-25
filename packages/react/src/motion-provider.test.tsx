import { act, cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultMotionTokens } from "easecraft-tokens";

import { MotionProvider, useMotionConfig, useReducedMotion } from "./motion-provider.js";

const listeners = new Set<() => void>();
let systemReducedMotion = false;

const mediaQueryList = {
  get matches() {
    return systemReducedMotion;
  },
  media: "(prefers-reduced-motion: reduce)",
  onchange: null,
  addEventListener: vi.fn((_event: string, listener: () => void) => {
    listeners.add(listener);
  }),
  removeEventListener: vi.fn((_event: string, listener: () => void) => {
    listeners.delete(listener);
  }),
} as unknown as MediaQueryList;

function setSystemReducedMotion(matches: boolean) {
  systemReducedMotion = matches;
  listeners.forEach((listener) => {
    listener();
  });
}

beforeEach(() => {
  listeners.clear();
  systemReducedMotion = false;
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useReducedMotion", () => {
  it("follows the system preference without a provider and cleans up", () => {
    const { result, unmount } = renderHook(() => useReducedMotion());

    expect(result.current).toBe(false);

    act(() => {
      setSystemReducedMotion(true);
    });

    expect(result.current).toBe(true);
    expect(listeners).toHaveLength(1);

    unmount();

    expect(listeners).toHaveLength(0);
  });

  it.each([
    ["always", false, true],
    ["never", true, false],
  ] as const)("resolves the %s provider override", (mode, systemPreference, expected) => {
    systemReducedMotion = systemPreference;

    const { result } = renderHook(() => useReducedMotion(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MotionProvider reducedMotion={mode}>{children}</MotionProvider>
      ),
    });

    expect(result.current).toBe(expected);
    expect(listeners).toHaveLength(0);
  });

  it("follows system changes when the provider uses system mode", () => {
    const { result } = renderHook(() => useReducedMotion(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MotionProvider reducedMotion="system">{children}</MotionProvider>
      ),
    });

    act(() => {
      setSystemReducedMotion(true);
    });

    expect(result.current).toBe(true);
  });

  it("uses a non-reduced server snapshot", () => {
    function ServerProbe() {
      return <span data-reduced-motion={useReducedMotion()} />;
    }

    systemReducedMotion = true;

    expect(renderToString(<ServerProbe />)).toContain('data-reduced-motion="false"');
  });
});

describe("useMotionConfig", () => {
  it("returns system mode and default tokens without a provider", () => {
    const { result } = renderHook(() => useMotionConfig());

    expect(result.current).toEqual({
      reducedMotion: false,
      reducedMotionMode: "system",
      tokens: defaultMotionTokens,
    });
  });

  it("resolves partial provider token overrides", () => {
    const { result } = renderHook(() => useMotionConfig(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MotionProvider
          tokens={{
            duration: { normal: 360 },
            easing: { enter: "out(4)" },
          }}
        >
          {children}
        </MotionProvider>
      ),
    });

    expect(result.current.tokens).toEqual({
      ...defaultMotionTokens,
      duration: { ...defaultMotionTokens.duration, normal: 360 },
      easing: { ...defaultMotionTokens.easing, enter: "out(4)" },
    });
  });
});
