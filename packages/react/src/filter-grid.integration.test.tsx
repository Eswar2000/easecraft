import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { FilterGrid } from "./filter-grid.js";

const items = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
] as const;

const filters = [{ label: "All", matches: () => true, value: "all" }] as const;

afterEach(() => {
  cleanup();
});

describe("FilterGrid integration", () => {
  it("restores in-flight grid item styles when its Anime.js scope reverts", async () => {
    const view = render(
      <FilterGrid duration={10_000} filters={filters} getKey={(item) => item.id} items={items}>
        {(item) => item.name}
      </FilterGrid>,
    );
    const item = view.getByText("Alpha").closest("li");

    if (!item) {
      throw new Error("Expected the first grid item");
    }

    await waitFor(() => {
      expect(item.style.opacity).not.toBe("");
    });

    view.unmount();

    await waitFor(() => {
      expect(item.style.opacity).toBe("");
      expect(item.style.transform).toBe("");
    });
  });
});
