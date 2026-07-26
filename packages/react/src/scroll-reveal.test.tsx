import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { animateMock, createScopeMock, scopeAddMock, scopeRevertMock } = vi.hoisted(() => ({
  animateMock: vi.fn(),
  createScopeMock: vi.fn(),
  scopeAddMock: vi.fn(),
  scopeRevertMock: vi.fn(),
}));

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

vi.mock("animejs/scope", () => ({
  createScope: createScopeMock,
}));

import { MotionProvider } from "./motion-provider.js";
import { ScrollReveal } from "./scroll-reveal.js";

interface ObserverInstance {
  callback: IntersectionObserverCallback;
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
  options: IntersectionObserverInit;
  unobserve: ReturnType<typeof vi.fn>;
}

interface AnimationParameters {
  onComplete?: () => void;
}

const observers: ObserverInstance[] = [];

class IntersectionObserverStub {
  readonly callback: IntersectionObserverCallback;
  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly options: IntersectionObserverInit;
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.options = options;
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    observers.push({
      callback,
      disconnect: this.disconnect,
      observe: this.observe,
      options,
      unobserve: this.unobserve,
    });
  }

  takeRecords() {
    return [];
  }
}

function notify(observer: ObserverInstance, target: Element, isIntersecting: boolean) {
  act(() => {
    observer.callback(
      [
        {
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: target.getBoundingClientRect(),
          isIntersecting,
          rootBounds: null,
          target,
          time: 0,
        },
      ],
      {} as IntersectionObserver,
    );
  });
}

function completeAnimation(index: number) {
  const parameters = animateMock.mock.calls[index]?.[1] as AnimationParameters;

  act(() => {
    parameters.onComplete?.();
  });
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  scopeAddMock.mockImplementation((setup: () => void) => {
    setup();
  });
  createScopeMock.mockReturnValue({ add: scopeAddMock, revert: scopeRevertMock });
});

afterEach(() => {
  cleanup();
  observers.length = 0;
  vi.unstubAllGlobals();
  animateMock.mockReset();
  createScopeMock.mockReset();
  scopeAddMock.mockReset();
  scopeRevertMock.mockReset();
});

describe("ScrollReveal", () => {
  it("observes a hidden enhanced element with normalized viewport options", () => {
    const view = render(
      <ScrollReveal
        data-testid="reveal"
        rootMargin="0px 0px -20% 0px"
        threshold={[-1, 0.5, 2, 0.5]}
      >
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");
    const observer = observers[0];

    expect(observer?.observe).toHaveBeenCalledWith(element);
    expect(observer?.options).toEqual({
      root: null,
      rootMargin: "0px 0px -20% 0px",
      threshold: [0, 0.5, 1],
    });
    expect(element.dataset["easecraftScrollState"]).toBe("waiting");
    expect(element.style.opacity).toBe("0");
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("reveals once with token values, callbacks, and observer cleanup", () => {
    const onReveal = vi.fn();
    const onVisibilityChange = vi.fn();
    const view = render(
      <ScrollReveal
        data-testid="reveal"
        delay={40}
        distance="large"
        duration="slow"
        easing="emphasized"
        onReveal={onReveal}
        onVisibilityChange={onVisibilityChange}
      >
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");
    const observer = observers[0];

    if (!observer) {
      throw new Error("Expected an observer");
    }

    notify(observer, element, true);

    expect(element.dataset["easecraftScrollState"]).toBe("revealing");
    const animationParameters = animateMock.mock.calls[0]?.[1] as AnimationParameters;

    expect(animationParameters.onComplete).toBeTypeOf("function");
    expect(animateMock).toHaveBeenCalledWith(element, {
      delay: 40,
      duration: 600,
      ease: "out(5)",
      onComplete: animationParameters.onComplete,
      opacity: [0, 1],
      y: [24, 0],
    });

    completeAnimation(0);

    expect(element.dataset["easecraftScrollState"]).toBe("revealed");
    expect(element.style.opacity).toBe("");
    expect(element.style.transform).toBe("");
    expect(onVisibilityChange).toHaveBeenCalledWith(true);
    expect(onReveal).toHaveBeenCalledOnce();
    expect(observer.disconnect).toHaveBeenCalledOnce();
  });

  it("keeps observation stable while using the latest callback identities", () => {
    const firstOnReveal = vi.fn();
    const firstOnVisibilityChange = vi.fn();
    const latestOnReveal = vi.fn();
    const latestOnVisibilityChange = vi.fn();
    const view = render(
      <ScrollReveal
        data-testid="reveal"
        onReveal={firstOnReveal}
        onVisibilityChange={firstOnVisibilityChange}
      >
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");
    const observer = observers[0];

    if (!observer) {
      throw new Error("Expected an observer");
    }

    view.rerender(
      <ScrollReveal
        data-testid="reveal"
        onReveal={latestOnReveal}
        onVisibilityChange={latestOnVisibilityChange}
      >
        Content
      </ScrollReveal>,
    );

    expect(observers).toHaveLength(1);
    expect(observer.disconnect).not.toHaveBeenCalled();

    notify(observer, element, true);
    completeAnimation(0);

    expect(firstOnVisibilityChange).not.toHaveBeenCalled();
    expect(firstOnReveal).not.toHaveBeenCalled();
    expect(latestOnVisibilityChange).toHaveBeenCalledWith(true);
    expect(latestOnReveal).toHaveBeenCalledOnce();
  });

  it("resets and replays when once is disabled", () => {
    const onVisibilityChange = vi.fn();
    const view = render(
      <ScrollReveal data-testid="reveal" onVisibilityChange={onVisibilityChange} once={false}>
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");
    const observer = observers[0];

    if (!observer) {
      throw new Error("Expected an observer");
    }

    notify(observer, element, true);
    completeAnimation(0);
    notify(observer, element, false);

    expect(element.dataset["easecraftScrollState"]).toBe("waiting");
    expect(element.style.opacity).toBe("0");
    expect(onVisibilityChange).toHaveBeenNthCalledWith(1, true);
    expect(onVisibilityChange).toHaveBeenNthCalledWith(2, false);
    expect(observer.disconnect).not.toHaveBeenCalled();

    notify(observer, element, true);
    expect(animateMock).toHaveBeenCalledTimes(2);
  });

  it("ignores stale completion after a repeated reveal is interrupted", () => {
    const onReveal = vi.fn();
    const view = render(
      <ScrollReveal data-testid="reveal" onReveal={onReveal} once={false}>
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");
    const observer = observers[0];

    if (!observer) {
      throw new Error("Expected an observer");
    }

    notify(observer, element, true);
    const staleComplete = (animateMock.mock.calls[0]?.[1] as AnimationParameters).onComplete;
    notify(observer, element, false);

    act(() => {
      staleComplete?.();
    });

    expect(element.dataset["easecraftScrollState"]).toBe("waiting");
    expect(onReveal).not.toHaveBeenCalled();
  });

  it("uses visibility for a rise-only waiting state", () => {
    const view = render(
      <ScrollReveal data-testid="reveal" preset="rise">
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");

    expect(element.style.opacity).toBe("");
    expect(element.style.visibility).toBe("hidden");
  });

  it("stays visible without an observer implementation", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const view = render(<ScrollReveal data-testid="reveal">Content</ScrollReveal>);
    const element = view.getByTestId("reveal");

    expect(element.dataset["easecraftScrollState"]).toBe("visible");
    expect(element.style.opacity).toBe("");
    expect(observers).toHaveLength(0);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("stays immediately visible under reduced motion", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <ScrollReveal data-testid="reveal">Content</ScrollReveal>
      </MotionProvider>,
    );
    const element = view.getByTestId("reveal");

    expect(element.dataset["easecraftScrollState"]).toBe("revealed");
    expect(element.style.opacity).toBe("");
    expect(observers).toHaveLength(0);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("disconnects and restores authored styles on unmount", () => {
    const view = render(
      <ScrollReveal data-testid="reveal" style={{ opacity: 0.8, transform: "translateX(2px)" }}>
        Content
      </ScrollReveal>,
    );
    const element = view.getByTestId("reveal");
    const observer = observers[0];

    view.unmount();

    expect(observer?.disconnect).toHaveBeenCalledOnce();
    expect(element.style.opacity).toBe("0.8");
    expect(element.style.transform).toBe("translateX(2px)");
  });

  it("renders the requested host and forwards its ref", () => {
    const sectionRef = createRef<HTMLElement>();
    const view = render(
      <ScrollReveal as="section" className="reveal" ref={sectionRef}>
        Content
      </ScrollReveal>,
    );

    expect(sectionRef.current).toBe(view.container.firstElementChild);
    expect(sectionRef.current?.className).toBe("reveal");
  });

  it("renders visible semantic content on the server", () => {
    const html = renderToString(
      <ScrollReveal as="article">Readable without JavaScript</ScrollReveal>,
    );

    expect(html).toContain("<article");
    expect(html).toContain("Readable without JavaScript");
    expect(html).toContain('data-easecraft-scroll-state="visible"');
    expect(html).not.toContain("opacity:0");
    expect(animateMock).not.toHaveBeenCalled();
  });
});
