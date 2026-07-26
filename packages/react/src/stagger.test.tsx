import { createRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { animateMock, staggerDelay, staggerMock } = vi.hoisted(() => ({
  animateMock: vi.fn(),
  staggerDelay: vi.fn(),
  staggerMock: vi.fn(),
}));

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

vi.mock("animejs/utils", () => ({ stagger: staggerMock }));

import { MotionProvider } from "./motion-provider.js";
import { Stagger } from "./stagger.js";

afterEach(() => {
  cleanup();
  animateMock.mockReset();
  staggerMock.mockReset();
  staggerMock.mockReturnValue(staggerDelay);
});

staggerMock.mockReturnValue(staggerDelay);

describe("Stagger", () => {
  it("animates direct element children with the default token contract", () => {
    const view = render(
      <Stagger data-testid="stagger">
        Intro text
        <span>Alpha</span>
        <span>Beta</span>
        <span>Gamma</span>
      </Stagger>,
    );
    const root = view.getByTestId("stagger");
    const targets = Array.from(root.children);

    expect(staggerMock).toHaveBeenCalledWith(60, { from: "first", start: 0 });
    expect(animateMock).toHaveBeenCalledWith(targets, {
      delay: staggerDelay,
      duration: 300,
      ease: "out(3)",
      opacity: [0, 1],
      y: [12, 0],
    });
  });

  it("caps the stagger span and starts reverse order from the last child", () => {
    const view = render(
      <Stagger interval={100} maxDelay={120} order="reverse">
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
        <span>Four</span>
        <span>Five</span>
      </Stagger>,
    );

    expect(view.container.firstElementChild?.children).toHaveLength(5);
    expect(staggerMock).toHaveBeenCalledWith(30, { from: "last", start: 0 });
  });

  it("resolves provider overrides and controlled animation properties", () => {
    const onComplete = vi.fn();

    render(
      <MotionProvider
        tokens={{
          distance: { large: 32 },
          duration: { slow: 900 },
          easing: { emphasized: "out(7)" },
          stagger: { relaxed: 140 },
        }}
      >
        <Stagger
          delay={40}
          distance="large"
          duration="slow"
          easing="emphasized"
          interval="relaxed"
          maxDelay="slow"
          onComplete={onComplete}
          preset="rise"
        >
          <span>One</span>
          <span>Two</span>
          <span>Three</span>
        </Stagger>
      </MotionProvider>,
    );

    expect(staggerMock).toHaveBeenCalledWith(140, { from: "first", start: 40 });
    expect(animateMock).toHaveBeenCalledWith(expect.any(Array), {
      delay: staggerDelay,
      duration: 900,
      ease: "out(7)",
      onComplete,
      y: [32, 0],
    });
  });

  it("finishes immediately without animation when reduced motion is active", () => {
    const onComplete = vi.fn();

    render(
      <MotionProvider reducedMotion="always">
        <Stagger onComplete={onComplete}>
          <span>One</span>
          <span>Two</span>
        </Stagger>
      </MotionProvider>,
    );

    expect(staggerMock).not.toHaveBeenCalled();
    expect(animateMock).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("renders text-only content without creating an empty animation", () => {
    const onComplete = vi.fn();
    const view = render(<Stagger onComplete={onComplete}>Readable content</Stagger>);

    expect(view.container.textContent).toBe("Readable content");
    expect(animateMock).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("renders the requested host, forwards its ref, and preserves element props", () => {
    const listRef = createRef<HTMLUListElement>();
    const view = render(
      <Stagger as="ul" aria-label="Milestones" className="milestones" ref={listRef}>
        <li>Foundation</li>
        <li>Components</li>
      </Stagger>,
    );

    expect(listRef.current).toBe(view.getByRole("list", { name: "Milestones" }));
    expect(listRef.current?.className).toBe("milestones");
  });

  it("recreates the sequence when keyed children are inserted or reordered", () => {
    const view = render(
      <Stagger>
        <span key="alpha">Alpha</span>
        <span key="beta">Beta</span>
      </Stagger>,
    );

    view.rerender(
      <Stagger className="updated">
        <span key="alpha">Alpha</span>
        <span key="beta">Beta</span>
      </Stagger>,
    );

    expect(animateMock).toHaveBeenCalledOnce();

    view.rerender(
      <Stagger>
        <span key="gamma">Gamma</span>
        <span key="alpha">Alpha</span>
        <span key="beta">Beta</span>
      </Stagger>,
    );

    expect(animateMock).toHaveBeenCalledTimes(2);
    expect(animateMock.mock.calls[1]?.[0]).toEqual(
      Array.from(view.container.children[0]!.children),
    );
  });

  it("renders semantic child markup on the server", () => {
    const html = renderToString(
      <Stagger as="ol" aria-label="Sequence">
        <li>First</li>
        <li>Second</li>
      </Stagger>,
    );

    expect(html).toContain('<ol aria-label="Sequence">');
    expect(html).toContain("<li>First</li><li>Second</li>");
    expect(animateMock).not.toHaveBeenCalled();
  });
});
