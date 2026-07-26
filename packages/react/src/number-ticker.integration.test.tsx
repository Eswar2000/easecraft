import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NumberTicker } from "./number-ticker.js";

afterEach(() => {
  cleanup();
});

describe("NumberTicker integration", () => {
  it("paints and replaces final values without exposing intermediate frames", async () => {
    const onComplete = vi.fn();
    const view = render(
      <NumberTicker announce="polite" duration={0} from={10} onComplete={onComplete} value={25} />,
    );
    const visualValue = view.container.querySelector<HTMLElement>("[data-easecraft-number-value]");
    const accessibleValue = view.container.querySelector<HTMLElement>(
      "[data-easecraft-number-accessible]",
    );

    await waitFor(() => {
      expect(visualValue?.textContent).toBe("25");
    });

    expect(accessibleValue?.textContent).toBe("25");
    expect(onComplete).toHaveBeenCalledTimes(1);

    act(() => {
      view.rerender(
        <NumberTicker
          announce="polite"
          duration={0}
          from={10}
          onComplete={onComplete}
          value={40}
        />,
      );
    });

    await waitFor(() => {
      expect(visualValue?.textContent).toBe("40");
    });

    expect(accessibleValue?.textContent).toBe("40");
    expect(onComplete).toHaveBeenCalledTimes(2);
  });
});
