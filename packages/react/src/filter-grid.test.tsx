import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { animateMock, scopeAddMock, scopeRevertMock, staggerDelay, staggerMock } = vi.hoisted(
  () => ({
    animateMock: vi.fn(),
    scopeAddMock: vi.fn(),
    scopeRevertMock: vi.fn(),
    staggerDelay: vi.fn(),
    staggerMock: vi.fn(),
  }),
);

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

vi.mock("animejs/scope", () => ({
  createScope: vi.fn(() => ({ add: scopeAddMock, revert: scopeRevertMock })),
}));

vi.mock("animejs/utils", () => ({ stagger: staggerMock }));

import { FilterGrid, type FilterGridFilter } from "./filter-grid.js";
import { MotionProvider } from "./motion-provider.js";

interface Project {
  category: "feedback" | "layout" | "text";
  id: number;
  name: string;
}

type ProjectFilter = "all" | Project["category"];

const projects = [
  { category: "text", id: 1, name: "Text Reveal" },
  { category: "layout", id: 2, name: "Animated Tabs" },
  { category: "feedback", id: 3, name: "Number Ticker" },
] satisfies readonly Project[];

const filters = [
  { label: "All", matches: () => true, value: "all" },
  { label: "Text", matches: (project) => project.category === "text", value: "text" },
  { label: "Layout", matches: (project) => project.category === "layout", value: "layout" },
  {
    label: "Feedback",
    matches: (project) => project.category === "feedback",
    value: "feedback",
  },
] satisfies readonly FilterGridFilter<Project, ProjectFilter>[];

interface AnimationParameters {
  onComplete?: () => void;
}

function getAnimationParameters(index: number) {
  return animateMock.mock.calls[index]?.[1] as AnimationParameters;
}

beforeEach(() => {
  scopeAddMock.mockImplementation((setup: () => void) => {
    setup();
  });
  staggerMock.mockReturnValue(staggerDelay);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  animateMock.mockReset();
  scopeAddMock.mockReset();
  scopeRevertMock.mockReset();
  staggerMock.mockReset();
});

describe("FilterGrid", () => {
  it("renders accessible controls, semantic items, and the target result count", () => {
    const view = render(
      <FilterGrid filters={filters} getKey={(project) => project.id} items={projects}>
        {(project) => <span>{project.name}</span>}
      </FilterGrid>,
    );

    expect(view.getByRole("group", { name: "Filter items" })).not.toBeNull();
    expect(view.getByRole("button", { name: "All" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("status").textContent).toBe("3 results");
    expect(view.getByRole("list", { name: "3 results" })).not.toBeNull();
    expect(view.getAllByRole("listitem")).toHaveLength(3);
  });

  it("filters uncontrolled items and reports selection changes", () => {
    const onValueChange = vi.fn();
    const view = render(
      <FilterGrid
        filters={filters}
        getKey={(project) => project.id}
        items={projects}
        onValueChange={onValueChange}
      >
        {(project) => project.name}
      </FilterGrid>,
    );

    fireEvent.click(view.getByRole("button", { name: "Layout" }));

    expect(onValueChange).toHaveBeenCalledWith("layout");
    expect(view.getByRole("button", { name: "Layout" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("status").textContent).toBe("1 result");
    expect(view.getByText("Animated Tabs")).not.toBeNull();
  });

  it("retains filtered items, hides them semantically, and moves focus", () => {
    const view = render(
      <FilterGrid filters={filters} getKey={(project) => project.id} items={projects} value="all">
        {(project) => <button type="button">Open {project.name}</button>}
      </FilterGrid>,
    );
    completeInitialEntry();
    const textButton = view.getByRole("button", { name: "Open Text Reveal" });
    textButton.focus();

    view.rerender(
      <FilterGrid
        filters={filters}
        getKey={(project) => project.id}
        items={projects}
        value="layout"
      >
        {(project) => <button type="button">Open {project.name}</button>}
      </FilterGrid>,
    );

    const exitingItem = textButton.closest("li");
    expect(exitingItem?.getAttribute("data-state")).toBe("exiting");
    expect(exitingItem?.getAttribute("aria-hidden")).toBe("true");
    expect(exitingItem?.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(view.getByRole("button", { name: "Open Animated Tabs" }));
    expect(view.getByRole("status").textContent).toBe("1 result");
  });

  it("ignores stale exit completion when a filter rapidly re-includes an item", () => {
    const view = render(
      <FilterGrid filters={filters} getKey={(project) => project.id} items={projects} value="all">
        {(project) => project.name}
      </FilterGrid>,
    );
    completeInitialEntry();

    view.rerender(
      <FilterGrid
        filters={filters}
        getKey={(project) => project.id}
        items={projects}
        value="layout"
      >
        {(project) => project.name}
      </FilterGrid>,
    );
    const staleExitComplete = getAnimationParameters(1).onComplete;

    view.rerender(
      <FilterGrid filters={filters} getKey={(project) => project.id} items={projects} value="all">
        {(project) => project.name}
      </FilterGrid>,
    );

    act(() => {
      staleExitComplete?.();
    });

    expect(view.getByText("Text Reveal").closest("li")?.getAttribute("data-state")).toBe(
      "entering",
    );
  });

  it("animates measured two-axis grid reflow after retained exits complete", () => {
    const view = render(
      <FilterGrid filters={filters} getKey={(project) => project.id} items={projects} value="all">
        {(project) => project.name}
      </FilterGrid>,
    );
    const layoutItem = view.getByText("Animated Tabs").closest("li");

    if (!layoutItem) {
      throw new Error("Expected the layout grid item");
    }

    let moved = false;
    vi.spyOn(layoutItem, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(moved ? 0 : 110, moved ? 80 : 0, 100, 70),
    );
    completeInitialEntry();
    animateMock.mockClear();

    view.rerender(
      <FilterGrid
        filters={filters}
        getKey={(project) => project.id}
        items={projects}
        value="layout"
      >
        {(project) => project.name}
      </FilterGrid>,
    );
    moved = true;
    act(() => {
      getAnimationParameters(0).onComplete?.();
    });

    expect(animateMock).toHaveBeenCalledWith(layoutItem, {
      duration: 300,
      ease: "inOut(3)",
      x: [110, 0],
      y: [-80, 0],
    });
  });

  it("renders an empty state and custom result label", () => {
    const noneFilter = [
      { label: "None", matches: () => false, value: "none" },
    ] satisfies readonly FilterGridFilter<Project, "none">[];
    const view = render(
      <FilterGrid
        empty={<strong>Nothing here</strong>}
        filters={noneFilter}
        getKey={(project) => project.id}
        items={projects}
        resultLabel={(count) => `${count.toString()} matching projects`}
      >
        {(project) => project.name}
      </FilterGrid>,
    );

    expect(view.getByRole("status").textContent).toBe("0 matching projects");
    expect(view.getByText("Nothing here")).not.toBeNull();
  });

  it("settles filtering immediately under reduced motion", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <FilterGrid filters={filters} getKey={(project) => project.id} items={projects}>
          {(project) => project.name}
        </FilterGrid>
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Layout" }));

    expect(view.queryByText("Text Reveal")).toBeNull();
    expect(view.getAllByRole("listitem")).toHaveLength(1);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("forwards polymorphic host props and refs", () => {
    const sectionRef = createRef<HTMLElement>();
    const view = render(
      <FilterGrid
        as="section"
        className="project-grid"
        filters={filters}
        getKey={(project) => project.id}
        items={projects}
        ref={sectionRef}
      >
        {(project) => project.name}
      </FilterGrid>,
    );

    expect(sectionRef.current).toBe(view.container.firstElementChild);
    expect(sectionRef.current?.className).toBe("project-grid");
  });

  it("rejects duplicate filter values", () => {
    expect(() =>
      render(
        <FilterGrid
          filters={[
            { label: "One", matches: () => true, value: "duplicate" },
            { label: "Two", matches: () => false, value: "duplicate" },
          ]}
          getKey={(project: Project) => project.id}
          items={projects}
        >
          {(project) => project.name}
        </FilterGrid>,
      ),
    ).toThrow("FilterGrid received a duplicate filter value: duplicate");
  });

  it("renders semantic filtered output on the server", () => {
    const html = renderToString(
      <FilterGrid
        defaultValue="layout"
        filters={filters}
        getKey={(project) => project.id}
        items={projects}
      >
        {(project) => project.name}
      </FilterGrid>,
    );

    expect(html).toContain('role="group"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Animated Tabs");
    expect(html).not.toContain("Text Reveal");
    expect(animateMock).not.toHaveBeenCalled();
  });
});

function completeInitialEntry() {
  act(() => {
    getAnimationParameters(0).onComplete?.();
  });
}
