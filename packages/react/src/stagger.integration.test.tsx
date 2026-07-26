import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Stagger } from "./stagger.js";

afterEach(() => {
  cleanup();
});

describe("Stagger integration", () => {
  it("restores child inline styles when its Anime.js scope reverts", () => {
    const view = render(
      <Stagger duration={0} interval={0}>
        <span data-testid="first" style={{ opacity: 0.8, transform: "translateX(2px)" }}>
          First
        </span>
        <span>Second</span>
      </Stagger>,
    );
    const firstChild = view.getByTestId("first");

    expect(firstChild.style.opacity).not.toBe("0.8");

    view.unmount();

    expect(firstChild.style.opacity).toBe("0.8");
    expect(firstChild.style.transform).toBe("translateX(2px)");
  });
});
