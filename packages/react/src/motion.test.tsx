import { createRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { animateMock } = vi.hoisted(() => ({ animateMock: vi.fn() }));

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

import { Motion } from "./motion.js";
import { MotionProvider } from "./motion-provider.js";

afterEach(() => {
  cleanup();
  animateMock.mockReset();
});

describe("Motion", () => {
  it("renders the requested host, forwards its ref, and resolves the default preset", () => {
    const buttonRef = createRef<HTMLButtonElement>();
    const view = render(
      <Motion as="button" data-testid="motion" ref={buttonRef} type="button">
        Animate
      </Motion>,
    );
    const element = view.getByTestId("motion");

    expect(element).toBeInstanceOf(HTMLButtonElement);
    expect(element.getAttribute("type")).toBe("button");
    expect(element.textContent).toBe("Animate");
    expect(buttonRef.current).toBe(element);
    expect(animateMock).toHaveBeenCalledWith(element, {
      delay: 0,
      duration: 300,
      ease: "out(3)",
      opacity: [0, 1],
      y: [12, 0],
    });
  });

  it.each([
    ["fade", { delay: 0, duration: 300, ease: "out(3)", opacity: [0, 1] }],
    ["rise", { delay: 0, duration: 300, ease: "out(3)", y: [12, 0] }],
    ["fade-rise", { delay: 0, duration: 300, ease: "out(3)", opacity: [0, 1], y: [12, 0] }],
  ] as const)("maps the %s preset to controlled animation properties", (preset, expected) => {
    const view = render(<Motion data-testid="motion" preset={preset} />);

    expect(animateMock).toHaveBeenCalledWith(view.getByTestId("motion"), expected);
  });

  it("uses an opacity-only fallback when reduced motion is active", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <Motion data-testid="motion" preset="rise" />
      </MotionProvider>,
    );

    expect(animateMock).toHaveBeenCalledWith(view.getByTestId("motion"), {
      delay: 0,
      duration: 300,
      ease: "out(3)",
      opacity: [0, 1],
    });
  });

  it("resolves semantic overrides from provider tokens", () => {
    const view = render(
      <MotionProvider
        tokens={{
          distance: { large: 30 },
          duration: { slow: 720 },
          easing: { emphasized: "out(6)" },
        }}
      >
        <Motion
          data-testid="motion"
          delay={40}
          distance="large"
          duration="slow"
          easing="emphasized"
        />
      </MotionProvider>,
    );

    expect(animateMock).toHaveBeenCalledWith(view.getByTestId("motion"), {
      delay: 40,
      duration: 720,
      ease: "out(6)",
      opacity: [0, 1],
      y: [30, 0],
    });
  });

  it("replays with numeric and raw easing overrides when props change", () => {
    const view = render(
      <Motion
        data-testid="motion"
        distance={18}
        duration={420}
        easing="cubicBezier(0.2, 0.8, 0.2, 1)"
        preset="rise"
      />,
    );

    view.rerender(
      <Motion data-testid="motion" distance={24} duration={500} easing="linear" preset="rise" />,
    );

    expect(animateMock).toHaveBeenCalledTimes(2);
    expect(animateMock).toHaveBeenLastCalledWith(view.getByTestId("motion"), {
      delay: 0,
      duration: 500,
      ease: "linear",
      y: [24, 0],
    });
  });

  it("rebinds the animation when the intrinsic host changes", () => {
    const view = render(<Motion as="div" data-testid="motion" />);

    view.rerender(<Motion as="span" data-testid="motion" />);

    expect(animateMock).toHaveBeenCalledTimes(2);
    expect(animateMock.mock.calls[1]?.[0]).toBeInstanceOf(HTMLSpanElement);
  });
});
