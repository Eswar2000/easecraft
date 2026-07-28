// @vitest-environment jsdom

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { ScrollDrivenArticleTimeline } from "../source/compositions/scroll-driven-article-timeline.package.js";

interface ObserverInstance {
  readonly callback: IntersectionObserverCallback;
  readonly disconnect: ReturnType<typeof vi.fn>;
  readonly observe: ReturnType<typeof vi.fn>;
  readonly options: IntersectionObserverInit;
}

const observers: ObserverInstance[] = [];

class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly disconnect = vi.fn();
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly callback: IntersectionObserverCallback;
  readonly options: IntersectionObserverInit;

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
    });
  }

  takeRecords() {
    return [];
  }
}

const sections = [
  {
    content: <p>We began with readable content and a narrow motion contract.</p>,
    date: "January 2026",
    id: "origin",
    label: "Origin",
    summary: "Start with semantics.",
    title: "A system begins",
  },
  {
    content: <p>Components gained scoped animation and reduced-motion behavior.</p>,
    id: "foundation",
    label: "Foundation",
    media: <span>09 components</span>,
    title: "Build the foundation",
  },
  {
    content: <p>Copyable compositions proved the system in realistic workflows.</p>,
    id: "registry",
    label: "Registry",
    title: "Compose the pieces",
  },
] as const;

function notify(
  observer: ObserverInstance,
  entries: readonly { readonly id: string; readonly ratio: number; readonly top: number }[],
) {
  act(() => {
    observer.callback(
      entries.map(({ id, ratio, top }) => {
        const target = document.getElementById(id);

        if (!target) {
          throw new Error(`Expected timeline section ${id}`);
        }

        return {
          boundingClientRect: {
            bottom: top + 400,
            height: 400,
            left: 0,
            right: 600,
            top,
            width: 600,
            x: 0,
            y: top,
            toJSON: () => ({}),
          },
          intersectionRatio: ratio,
          intersectionRect: target.getBoundingClientRect(),
          isIntersecting: ratio > 0,
          rootBounds: null,
          target,
          time: 0,
        } satisfies IntersectionObserverEntry;
      }),
      {} as IntersectionObserver,
    );
  });
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});

afterEach(() => {
  cleanup();
  observers.length = 0;
  vi.unstubAllGlobals();
});

describe("ScrollDrivenArticleTimeline", () => {
  it("renders semantic navigation, one article, linked sections, and an initial status", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <ScrollDrivenArticleTimeline sections={sections} />
      </MotionProvider>,
    );

    expect(view.getByRole("navigation", { name: "Article sections" })).toBeTruthy();
    expect(view.getByRole("article", { name: "Article timeline" })).toBeTruthy();
    expect(view.getAllByRole("link")).toHaveLength(3);
    expect(view.getByRole("link", { name: /Origin/ }).getAttribute("aria-current")).toBe(
      "location",
    );
    expect(view.getByRole("status").textContent).toBe("Section 1 of 3: Origin");
    expect(view.getAllByRole("region")).toHaveLength(3);
    expect(view.getByRole("region", { name: "A system begins" })).toBeTruthy();
    expect(view.getByText("09 components")).toBeTruthy();
  });

  it("tracks the most visible section and announces only active-section changes", () => {
    const onActiveSectionChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <ScrollDrivenArticleTimeline
          activeRootMargin="-10% 0px -50% 0px"
          activeThreshold={[-1, 0.5, 2, 0.5]}
          onActiveSectionChange={onActiveSectionChange}
          sections={sections}
        />
      </MotionProvider>,
    );
    const observer = observers[0];

    if (!observer) {
      throw new Error("Expected the active-section observer");
    }

    expect(observer.options).toEqual({
      root: null,
      rootMargin: "-10% 0px -50% 0px",
      threshold: [0, 0.5, 1],
    });
    expect(observer.observe).toHaveBeenCalledTimes(3);

    notify(observer, [
      { id: "origin", ratio: 0.2, top: -100 },
      { id: "foundation", ratio: 0.8, top: 120 },
    ]);

    expect(onActiveSectionChange).toHaveBeenCalledWith("foundation");
    expect(view.getByRole("link", { name: /Foundation/ }).getAttribute("aria-current")).toBe(
      "location",
    );
    expect(view.getByRole("status").textContent).toBe("Section 2 of 3: Foundation");

    notify(observer, [{ id: "foundation", ratio: 0.7, top: 90 }]);
    expect(onActiveSectionChange).toHaveBeenCalledOnce();
  });

  it("reports controlled observer changes without changing the rendered section", () => {
    const onActiveSectionChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <ScrollDrivenArticleTimeline
          activeSection="origin"
          onActiveSectionChange={onActiveSectionChange}
          sections={sections}
        />
      </MotionProvider>,
    );
    const observer = observers[0];

    if (!observer) {
      throw new Error("Expected the active-section observer");
    }

    notify(observer, [{ id: "registry", ratio: 0.9, top: 80 }]);

    expect(onActiveSectionChange).toHaveBeenCalledWith("registry");
    expect(view.getByRole("link", { name: /Origin/ }).getAttribute("aria-current")).toBe(
      "location",
    );
    expect(view.getByRole("status").textContent).toBe("Section 1 of 3: Origin");
  });

  it("updates immediately from timeline navigation", () => {
    const onActiveSectionChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <ScrollDrivenArticleTimeline
          onActiveSectionChange={onActiveSectionChange}
          sections={sections}
        />
      </MotionProvider>,
    );
    const registryLink = view.getByRole("link", { name: /Registry/ });
    const article = view.getByRole("article", { name: "Article timeline" });
    const registrySection = document.getElementById("registry");
    const scrollTo = vi.fn();

    if (!registrySection) {
      throw new Error("Expected the Registry section");
    }

    article.scrollTo = scrollTo;
    Object.defineProperty(article, "scrollTop", { configurable: true, value: 40 });
    article.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    registrySection.getBoundingClientRect = () => ({ top: 460 }) as DOMRect;
    registryLink.focus();

    fireEvent.click(registryLink);

    expect(onActiveSectionChange).toHaveBeenCalledWith("registry");
    expect(view.getByRole("status").textContent).toBe("Section 3 of 3: Registry");
    expect(registryLink.getAttribute("href")).toBe("#registry");
    expect(document.activeElement).toBe(registryLink);
    expect(scrollTo).toHaveBeenCalledWith({ top: 400 });
  });

  it("keeps content visible when observers are unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const view = render(<ScrollDrivenArticleTimeline sections={sections} />);

    expect(view.getAllByRole("region")).toHaveLength(3);
    expect(view.getByText("Compose the pieces")).toBeTruthy();
    expect(view.getByRole("status").textContent).toBe("Section 1 of 3: Origin");
  });

  it("rejects empty, duplicate, blank-label, and unknown section states", () => {
    expect(() => render(<ScrollDrivenArticleTimeline sections={[]} />)).toThrow(
      "ScrollDrivenArticleTimeline requires at least one section.",
    );
    expect(() =>
      render(<ScrollDrivenArticleTimeline sections={[sections[0], sections[0]]} />),
    ).toThrow("ScrollDrivenArticleTimeline received a duplicate section id: origin");
    expect(() =>
      render(
        <ScrollDrivenArticleTimeline sections={[{ content: "Blank", id: "blank", label: " " }]} />,
      ),
    ).toThrow("ScrollDrivenArticleTimeline section blank requires a label.");
    expect(() =>
      render(<ScrollDrivenArticleTimeline activeSection="missing" sections={sections} />),
    ).toThrow("ScrollDrivenArticleTimeline activeSection references an unknown section: missing");
  });
});
