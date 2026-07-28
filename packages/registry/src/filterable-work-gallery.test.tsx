// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { FilterableWorkGallery } from "../source/compositions/filterable-work-gallery.package.js";

const categories = [
  { label: "Product", value: "product" },
  { label: "Editorial", value: "editorial" },
  { label: "Identity", value: "identity" },
] as const;

const work = [
  {
    categories: ["product"],
    description: "A dense operational motion system.",
    href: "/work/easecraft",
    id: "easecraft",
    meta: "Open source",
    title: "Easecraft",
    year: "2026",
  },
  {
    categories: ["editorial", "identity"],
    description: "A publication and identity refresh.",
    id: "field-notes",
    meta: "Studio",
    title: "Field Notes",
    year: "2025",
  },
  {
    categories: ["product", "identity"],
    id: "relay",
    meta: "SaaS",
    title: "Relay",
    year: "2025",
  },
] as const;

afterEach(() => {
  cleanup();
});

describe("FilterableWorkGallery", () => {
  it("renders semantic filters, result count, and default project cards", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <FilterableWorkGallery categories={categories} items={work} />
      </MotionProvider>,
    );

    expect(view.getByRole("group", { name: "Filter work gallery" })).toBeTruthy();
    expect(view.getByRole("status").textContent).toBe("3 projects");
    expect(view.getAllByRole("listitem")).toHaveLength(3);
    expect(view.getByRole("link", { name: "Easecraft" }).getAttribute("href")).toBe(
      "/work/easecraft",
    );
    expect(view.getByRole("button", { name: "Product" })).toBeTruthy();
  });

  it("filters projects and reports category changes", () => {
    const onCategoryChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <FilterableWorkGallery
          categories={categories}
          items={work}
          onCategoryChange={onCategoryChange}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Editorial" }));

    expect(onCategoryChange).toHaveBeenCalledWith("editorial");
    expect(view.getByRole("status").textContent).toBe("1 project");
    expect(view.getByRole("heading", { name: "Field Notes" })).toBeTruthy();
    expect(view.queryByRole("heading", { name: "Easecraft" })).toBeNull();
  });

  it("renders an empty result for a category without matching work", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <FilterableWorkGallery
          categories={[...categories, { label: "Motion", value: "motion" }]}
          defaultCategory="motion"
          items={work}
        />
      </MotionProvider>,
    );

    expect(view.getByRole("status").textContent).toBe("0 projects");
    expect(view.getByText("No projects match this category.")).toBeTruthy();
  });

  it("reports controlled changes without changing the rendered category", () => {
    const onCategoryChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <FilterableWorkGallery
          categories={categories}
          category="product"
          items={work}
          onCategoryChange={onCategoryChange}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Editorial" }));

    expect(onCategoryChange).toHaveBeenCalledWith("editorial");
    expect(view.getByRole("button", { name: "Product" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("status").textContent).toBe("2 projects");
  });

  it("supports custom card rendering with item lifecycle state", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <FilterableWorkGallery categories={categories} items={work}>
          {(item, state) => (
            <span>
              {item.id}:{state}
            </span>
          )}
        </FilterableWorkGallery>
      </MotionProvider>,
    );

    expect(view.getByText("easecraft:present")).toBeTruthy();
  });

  it("rejects duplicate categories, duplicate items, and unknown category references", () => {
    expect(() =>
      render(<FilterableWorkGallery categories={[categories[0], categories[0]]} items={work} />),
    ).toThrow("FilterableWorkGallery received a duplicate category value: product");

    expect(() =>
      render(<FilterableWorkGallery categories={categories} items={[work[0], work[0]]} />),
    ).toThrow("FilterableWorkGallery received a duplicate item id: easecraft");

    expect(() =>
      render(
        <FilterableWorkGallery
          categories={categories}
          items={[{ categories: ["missing"], id: "bad", title: "Bad" }]}
        />,
      ),
    ).toThrow("FilterableWorkGallery item bad references an unknown category: missing");
  });
});
