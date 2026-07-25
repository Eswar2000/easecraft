import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { animateMock, splitTextMock, staggerDelay, staggerMock } = vi.hoisted(() => ({
  animateMock: vi.fn(),
  splitTextMock: vi.fn(),
  staggerDelay: vi.fn(),
  staggerMock: vi.fn(),
}));

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

vi.mock("animejs/text", () => ({ splitText: splitTextMock }));
vi.mock("animejs/utils", () => ({ stagger: staggerMock }));

import { TextReveal } from "./text-reveal.js";
import { MotionProvider } from "./motion-provider.js";

function createSplitter(segments: {
  readonly chars?: HTMLElement[];
  readonly lines?: HTMLElement[];
  readonly words?: HTMLElement[];
}) {
  const splitter = {
    addEffect: vi.fn((effect: (current: typeof splitter) => unknown) => {
      effect(splitter);
      return splitter;
    }),
    chars: segments.chars ?? [],
    html: "Motion with purpose.",
    lines: segments.lines ?? [],
    words: segments.words ?? [],
  };

  splitTextMock.mockReturnValue(splitter);
  staggerMock.mockReturnValue(staggerDelay);

  return splitter;
}

afterEach(() => {
  cleanup();
  animateMock.mockReset();
  splitTextMock.mockReset();
  staggerMock.mockReset();
});

describe("TextReveal", () => {
  it("preserves readable text and animates accessible word segments", () => {
    const words = [document.createElement("span"), document.createElement("span")];
    createSplitter({ words });
    const view = render(<TextReveal data-testid="text">Motion with purpose.</TextReveal>);
    const root = view.getByTestId("text");

    expect(root.textContent).toBe("Motion with purpose.");
    expect(splitTextMock).toHaveBeenCalledWith(root, {
      accessible: true,
      chars: false,
      lines: false,
      words: { wrap: "clip" },
    });
    expect(staggerMock).toHaveBeenCalledWith(60, { start: 0 });
    expect(animateMock).toHaveBeenCalledWith(words, {
      delay: staggerDelay,
      duration: 300,
      ease: "out(3)",
      opacity: [0, 1],
      y: [12, 0],
    });
  });

  it.each([
    ["lines", "lines", { accessible: true, chars: false, lines: { wrap: "clip" }, words: false }],
    [
      "characters",
      "chars",
      { accessible: true, chars: { wrap: "clip" }, lines: false, words: false },
    ],
  ] as const)("animates %s segments", (split, segmentKey, expectedOptions) => {
    const segments = [document.createElement("span"), document.createElement("span")];
    createSplitter({ [segmentKey]: segments });
    const view = render(
      <TextReveal data-testid="text" split={split}>
        Motion with purpose.
      </TextReveal>,
    );

    expect(splitTextMock).toHaveBeenCalledWith(view.getByTestId("text"), expectedOptions);
    expect(animateMock.mock.calls[0]?.[0]).toBe(segments);
  });

  it("uses an unsplit opacity-only fallback under reduced motion", () => {
    const onComplete = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <TextReveal data-testid="text" onComplete={onComplete} preset="rise">
          Motion with purpose.
        </TextReveal>
      </MotionProvider>,
    );
    const root = view.getByTestId("text");

    expect(splitTextMock).not.toHaveBeenCalled();
    expect(staggerMock).not.toHaveBeenCalled();
    expect(animateMock).toHaveBeenCalledWith(root, {
      duration: 100,
      ease: "linear",
      onComplete,
      opacity: [0, 1],
    });
  });

  it("resolves provider tokens and numeric overrides", () => {
    const chars = [document.createElement("span")];
    createSplitter({ chars });
    render(
      <MotionProvider
        tokens={{
          distance: { large: 30 },
          duration: { slow: 720 },
          easing: { emphasized: "out(6)" },
          stagger: { tight: 18 },
        }}
      >
        <TextReveal
          delay={40}
          distance="large"
          duration="slow"
          easing="emphasized"
          preset="rise"
          split="characters"
          stagger="tight"
        >
          Reveal
        </TextReveal>
      </MotionProvider>,
    );

    expect(staggerMock).toHaveBeenCalledWith(18, { start: 40 });
    expect(animateMock).toHaveBeenCalledWith(chars, {
      delay: staggerDelay,
      duration: 720,
      ease: "out(6)",
      y: [30, 0],
    });
  });

  it("supports numeric timing and raw easing overrides for fade reveals", () => {
    const words = [document.createElement("span")];
    createSplitter({ words });
    render(
      <TextReveal delay={25} duration={420} easing="linear" preset="fade" stagger={15}>
        Reveal
      </TextReveal>,
    );

    expect(staggerMock).toHaveBeenCalledWith(15, { start: 25 });
    expect(animateMock).toHaveBeenCalledWith(words, {
      delay: staggerDelay,
      duration: 420,
      ease: "linear",
      opacity: [0, 1],
    });
  });

  it("forwards host attributes and refs", () => {
    const words = [document.createElement("span")];
    createSplitter({ words });
    const headingRef = createRef<HTMLHeadingElement>();
    const view = render(
      <TextReveal as="h2" data-testid="text" id="reveal" ref={headingRef}>
        Motion with purpose.
      </TextReveal>,
    );
    const heading = view.getByTestId("text");

    expect(heading).toBeInstanceOf(HTMLHeadingElement);
    expect(heading.id).toBe("reveal");
    expect(headingRef.current).toBe(heading);
  });

  it("restores and re-splits updated text", () => {
    splitTextMock.mockImplementation(() => createSplitter({ words: [] }));
    const view = render(<TextReveal data-testid="text">First message</TextReveal>);

    view.rerender(<TextReveal data-testid="text">Updated message</TextReveal>);

    expect(view.getByTestId("text").textContent).toBe("Updated message");
    expect(splitTextMock).toHaveBeenCalledTimes(2);
  });

  it("invalidates a reverted line splitter so queued refreshes are inert", () => {
    const splitter = createSplitter({ lines: [document.createElement("span")] });
    const view = render(<TextReveal split="lines">Motion with purpose.</TextReveal>);

    view.unmount();

    expect(splitter.html).toBe("");
  });

  it("renders readable unsplit text on the server", () => {
    const html = renderToString(<TextReveal as="h2">Motion with purpose.</TextReveal>);

    expect(html).toContain("<h2");
    expect(html).toContain("Motion with purpose.");
    expect(splitTextMock).not.toHaveBeenCalled();
  });
});
