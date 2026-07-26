import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StaggeredList } from "./staggered-list.js";

afterEach(() => {
  cleanup();
});

describe("StaggeredList integration", () => {
  it("restores retained item styles when its Anime.js scope reverts", () => {
    const view = render(
      <StaggeredList
        duration={10_000}
        getKey={(item) => item}
        interval={0}
        items={["Alpha", "Beta"]}
      >
        {(item) => <span>{item}</span>}
      </StaggeredList>,
    );
    const firstItem = view.getByText("Alpha").closest("li");

    if (!firstItem) {
      throw new Error("Expected the first list item");
    }

    expect(firstItem.style.opacity).not.toBe("");

    view.unmount();

    expect(firstItem.style.opacity).toBe("");
    expect(firstItem.style.transform).toBe("");
  });
});
