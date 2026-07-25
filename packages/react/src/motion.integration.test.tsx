import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Motion } from "./motion.js";

afterEach(() => {
  cleanup();
});

describe("Motion integration", () => {
  it("restores existing inline styles when its Anime.js scope reverts", () => {
    const view = render(
      <Motion
        data-testid="motion"
        duration={0}
        style={{ opacity: 0.8, transform: "translateX(2px)" }}
      />,
    );
    const element = view.getByTestId("motion");

    expect(element.style.opacity).not.toBe("0.8");

    view.unmount();

    expect(element.style.opacity).toBe("0.8");
    expect(element.style.transform).toBe("translateX(2px)");
  });
});
