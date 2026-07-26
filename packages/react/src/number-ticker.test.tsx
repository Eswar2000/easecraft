import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { animateMock } = vi.hoisted(() => ({ animateMock: vi.fn() }));

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

import { NumberTicker } from "./number-ticker.js";
import { MotionProvider } from "./motion-provider.js";

interface AnimatedCounter {
  value: number;
}

interface NumberAnimationParameters {
  delay: number;
  duration: number;
  ease: string;
  onComplete: () => void;
  onUpdate: () => void;
  value: number;
}

function getAnimationCall(index = 0): [AnimatedCounter, NumberAnimationParameters] {
  return animateMock.mock.calls[index] as [AnimatedCounter, NumberAnimationParameters];
}

afterEach(() => {
  cleanup();
  animateMock.mockReset();
});

describe("NumberTicker", () => {
  it("formats the final accessible value and configures object animation", () => {
    const view = render(
      <NumberTicker
        announce="polite"
        formatOptions={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
        from={10}
        locale="en-US"
        prefix="$"
        suffix=" USD"
        value={1234.5}
      />,
    );
    const visualValue = view.container.querySelector<HTMLElement>("[data-easecraft-number-value]");
    const accessibleValue = view.container.querySelector<HTMLElement>(
      "[data-easecraft-number-accessible]",
    );
    const [counter, parameters] = getAnimationCall();

    expect(visualValue?.textContent).toBe("$10.0 USD");
    expect(accessibleValue?.textContent).toBe("$1,234.5 USD");
    expect(accessibleValue?.getAttribute("aria-live")).toBe("polite");
    expect(visualValue?.getAttribute("aria-hidden")).toBe("true");
    expect(counter).toEqual({ value: 10 });
    expect(parameters).toMatchObject({
      delay: 0,
      duration: 300,
      ease: "inOut(3)",
      value: 1234.5,
    });
  });

  it("paints formatted frame values and reports completion once", () => {
    const onComplete = vi.fn();
    const view = render(
      <NumberTicker
        formatOptions={{ maximumFractionDigits: 0 }}
        from={0}
        onComplete={onComplete}
        value={1000}
      />,
    );
    const visualValue = view.container.querySelector<HTMLElement>("[data-easecraft-number-value]");
    const [counter, parameters] = getAnimationCall();

    counter.value = 412.4;
    act(() => {
      parameters.onUpdate();
    });

    expect(visualValue?.textContent).toBe("412");

    act(() => {
      parameters.onComplete();
    });

    expect(visualValue?.textContent).toBe("1,000");
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(1000);
  });

  it("interrupts from the last painted value when the target changes rapidly", () => {
    const view = render(<NumberTicker from={0} value={100} />);
    const [firstCounter, firstParameters] = getAnimationCall();

    firstCounter.value = 42;
    act(() => {
      firstParameters.onUpdate();
    });

    view.rerender(<NumberTicker from={0} value={200} />);

    const [secondCounter, secondParameters] = getAnimationCall(1);
    expect(animateMock).toHaveBeenCalledTimes(2);
    expect(secondCounter.value).toBe(42);
    expect(secondParameters.value).toBe(200);
  });

  it("updates instantly and skips animation under reduced motion", () => {
    const onComplete = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <NumberTicker announce="assertive" from={10} onComplete={onComplete} value={250} />
      </MotionProvider>,
    );
    const visualValue = view.container.querySelector<HTMLElement>("[data-easecraft-number-value]");
    const accessibleValue = view.container.querySelector<HTMLElement>(
      "[data-easecraft-number-accessible]",
    );

    expect(animateMock).not.toHaveBeenCalled();
    expect(visualValue?.textContent).toBe("250");
    expect(accessibleValue?.getAttribute("aria-live")).toBe("assertive");
    expect(onComplete).toHaveBeenCalledWith(250);
  });

  it("renders non-finite values without passing invalid targets to Anime.js", () => {
    const view = render(<NumberTicker from={10} value={Number.NaN} />);
    const visualValue = view.container.querySelector<HTMLElement>("[data-easecraft-number-value]");

    expect(animateMock).not.toHaveBeenCalled();
    expect(visualValue?.textContent).toBe("NaN");
  });

  it("resolves provider duration tokens and raw easing overrides", () => {
    render(
      <MotionProvider tokens={{ duration: { slow: 720 } }}>
        <NumberTicker delay={30} duration="slow" easing="linear" value={50} />
      </MotionProvider>,
    );
    const [, parameters] = getAnimationCall();

    expect(parameters).toMatchObject({
      delay: 30,
      duration: 720,
      ease: "linear",
      value: 50,
    });
  });

  it("forwards host attributes and refs without enabling live announcements by default", () => {
    const outputRef = createRef<HTMLOutputElement>();
    const view = render(
      <NumberTicker as="output" data-testid="ticker" id="revenue" ref={outputRef} value={75} />,
    );
    const output = view.getByTestId("ticker");
    const accessibleValue = view.container.querySelector<HTMLElement>(
      "[data-easecraft-number-accessible]",
    );

    expect(output).toBeInstanceOf(HTMLOutputElement);
    expect(output.id).toBe("revenue");
    expect(outputRef.current).toBe(output);
    expect(accessibleValue?.hasAttribute("aria-live")).toBe(false);
  });

  it("renders the final semantic and visual value on the server", () => {
    const html = renderToString(
      <NumberTicker locale="en-US" prefix="$" suffix=" total" value={1250} />,
    );

    expect(html.match(/\$1,250 total/g)).toHaveLength(2);
    expect(html).toContain('aria-hidden="true"');
    expect(animateMock).not.toHaveBeenCalled();
  });
});
