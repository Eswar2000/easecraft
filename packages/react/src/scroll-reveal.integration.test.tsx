import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollReveal } from "./scroll-reveal.js";

let observerCallback: IntersectionObserverCallback | undefined;

class IntersectionObserverStub {
  readonly disconnect = vi.fn();
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  takeRecords() {
    return [];
  }
}

function reveal(element: Element) {
  observerCallback?.(
    [
      {
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRatio: 1,
        intersectionRect: element.getBoundingClientRect(),
        isIntersecting: true,
        rootBounds: null,
        target: element,
        time: 0,
      },
    ],
    {} as IntersectionObserver,
  );
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});

afterEach(() => {
  cleanup();
  observerCallback = undefined;
  vi.unstubAllGlobals();
});

describe("ScrollReveal integration", () => {
  it("restores authored styles after a completed reveal", async () => {
    const view = render(
      <ScrollReveal
        data-testid="reveal"
        duration={0}
        style={{ opacity: 0.8, transform: "translateX(2px)" }}
      >
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");

    reveal(element);

    await waitFor(() => {
      expect(element.dataset["easecraftScrollState"]).toBe("revealed");
    });
    expect(element.style.opacity).toBe("0.8");
    expect(element.style.transform).toBe("translateX(2px)");
  });

  it("restores authored styles when an in-flight reveal unmounts", async () => {
    const view = render(
      <ScrollReveal
        data-testid="reveal"
        duration={10_000}
        style={{ opacity: 0.8, transform: "translateX(2px)" }}
      >
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");

    reveal(element);

    await waitFor(() => {
      expect(element.style.opacity).not.toBe("0.8");
    });

    view.unmount();

    await waitFor(() => {
      expect(element.style.opacity).toBe("0.8");
      expect(element.style.transform).toBe("translateX(2px)");
    });
  });
});
