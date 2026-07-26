import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, render } from "@testing-library/react";
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

import { MotionProvider } from "./motion-provider.js";
import { StaggeredList } from "./staggered-list.js";

interface Project {
  id: number;
  name: string;
}

const projects = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
  { id: 3, name: "Gamma" },
  { id: 4, name: "Delta" },
  { id: 5, name: "Epsilon" },
] satisfies readonly Project[];

function getAnimationParameters(callIndex: number) {
  return animateMock.mock.calls[callIndex]?.[1] as { onComplete?: () => void };
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

describe("StaggeredList", () => {
  it("renders semantic items and bounds the initial stagger", () => {
    const listRef = createRef<HTMLOListElement>();
    const view = render(
      <StaggeredList
        as="ol"
        aria-label="Projects"
        getKey={(project) => project.id}
        interval={100}
        items={projects}
        maxDelay={120}
        ref={listRef}
      >
        {(project) => <span>{project.name}</span>}
      </StaggeredList>,
    );
    const list = view.getByRole("list", { name: "Projects" });
    const listItems = view.getAllByRole("listitem");

    expect(list).toBeInstanceOf(HTMLOListElement);
    expect(listRef.current).toBe(list);
    expect(listItems).toHaveLength(5);
    expect(listItems.map((item) => item.textContent)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
      "Delta",
      "Epsilon",
    ]);
    expect(staggerMock).toHaveBeenCalledWith(30, { from: "first", start: 0 });
    expect(animateMock).toHaveBeenCalledWith(
      listItems,
      expect.objectContaining({
        delay: staggerDelay,
        duration: 300,
        ease: "out(3)",
        opacity: [0, 1],
        y: [12, 0],
      }),
    );
    expect(typeof getAnimationParameters(0).onComplete).toBe("function");
  });

  it("retains an exiting item, transfers focus, and removes it after completion", () => {
    const view = render(
      <StaggeredList getKey={(project: Project) => project.id} items={projects.slice(0, 2)}>
        {(project) => <button type="button">{project.name}</button>}
      </StaggeredList>,
    );

    act(() => {
      getAnimationParameters(0).onComplete?.();
    });

    view.getByRole("button", { name: "Alpha" }).focus();
    view.rerender(
      <StaggeredList getKey={(project: Project) => project.id} items={projects.slice(1, 2)}>
        {(project) => <button type="button">{project.name}</button>}
      </StaggeredList>,
    );

    const exitingItem = view.getByText("Alpha").closest("li");
    expect(exitingItem?.dataset["state"]).toBe("exiting");
    expect(exitingItem?.getAttribute("aria-hidden")).toBe("true");
    expect(exitingItem?.hasAttribute("inert")).toBe(true);
    expect(document.activeElement).toBe(view.getByRole("button", { name: "Beta" }));

    act(() => {
      getAnimationParameters(1).onComplete?.();
    });

    expect(view.queryByText("Alpha")).toBeNull();
    expect(view.getAllByRole("listitem")).toHaveLength(1);
  });

  it("applies item changes immediately without animation under reduced motion", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <StaggeredList getKey={(project: Project) => project.id} items={projects.slice(0, 2)}>
          {(project) => project.name}
        </StaggeredList>
      </MotionProvider>,
    );

    expect(animateMock).not.toHaveBeenCalled();
    expect(view.getAllByRole("listitem")).toHaveLength(2);

    view.rerender(
      <MotionProvider reducedMotion="always">
        <StaggeredList getKey={(project: Project) => project.id} items={projects.slice(1, 2)}>
          {(project) => project.name}
        </StaggeredList>
      </MotionProvider>,
    );

    expect(animateMock).not.toHaveBeenCalled();
    expect(view.queryByText("Alpha")).toBeNull();
    expect(view.getAllByRole("listitem")).toHaveLength(1);
  });

  it("preserves keyed DOM nodes and animates their measured reorder deltas", () => {
    const alphaProject = projects[0];
    const betaProject = projects[1];

    if (!alphaProject || !betaProject) {
      throw new Error("Expected reorder fixtures");
    }

    const view = render(
      <StaggeredList getKey={(project: Project) => project.id} items={projects.slice(0, 2)}>
        {(project) => project.name}
      </StaggeredList>,
    );
    const alphaItem = view.getByText("Alpha").closest("li");
    const betaItem = view.getByText("Beta").closest("li");

    if (!alphaItem || !betaItem) {
      throw new Error("Expected semantic list items");
    }

    let reordered = false;
    let scrollOffset = 0;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollOffset);
    vi.spyOn(alphaItem, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(0, (reordered ? 50 : 0) - scrollOffset, 100, 40),
    );
    vi.spyOn(betaItem, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(0, (reordered ? 0 : 50) - scrollOffset, 100, 40),
    );

    act(() => {
      getAnimationParameters(0).onComplete?.();
    });
    animateMock.mockClear();
    reordered = true;
    scrollOffset = 300;

    view.rerender(
      <StaggeredList getKey={(project: Project) => project.id} items={[betaProject, alphaProject]}>
        {(project) => project.name}
      </StaggeredList>,
    );

    const reorderedItems = view.getAllByRole("listitem");
    expect(reorderedItems).toEqual([betaItem, alphaItem]);
    expect(animateMock).toHaveBeenCalledWith(betaItem, {
      duration: 300,
      ease: "inOut(3)",
      x: [0, 0],
      y: [50, 0],
    });
    expect(animateMock).toHaveBeenCalledWith(alphaItem, {
      duration: 300,
      ease: "inOut(3)",
      x: [0, 0],
      y: [-50, 0],
    });
  });

  it("ignores stale exit completion after an item rapidly re-enters", () => {
    const alpha = projects.slice(0, 1);
    const view = render(
      <StaggeredList getKey={(project: Project) => project.id} items={alpha}>
        {(project) => project.name}
      </StaggeredList>,
    );

    act(() => {
      getAnimationParameters(0).onComplete?.();
    });
    animateMock.mockClear();

    view.rerender(
      <StaggeredList getKey={(project: Project) => project.id} items={[]}>
        {(project) => project.name}
      </StaggeredList>,
    );
    const staleExitComplete = getAnimationParameters(0).onComplete;

    view.rerender(
      <StaggeredList getKey={(project: Project) => project.id} items={alpha}>
        {(project) => project.name}
      </StaggeredList>,
    );

    act(() => {
      staleExitComplete?.();
    });

    expect(view.getByText("Alpha").closest("li")?.dataset["state"]).toBe("entering");
    expect(view.getAllByRole("listitem")).toHaveLength(1);
  });

  it("rejects duplicate item keys", () => {
    expect(() =>
      render(
        <StaggeredList getKey={() => "duplicate"} items={projects.slice(0, 2)}>
          {(project) => project.name}
        </StaggeredList>,
      ),
    ).toThrow("StaggeredList received a duplicate key: duplicate");
  });

  it("renders semantic list markup on the server", () => {
    const html = renderToString(
      <StaggeredList as="ol" getKey={(project: Project) => project.id} items={projects.slice(0, 2)}>
        {(project) => <span>{project.name}</span>}
      </StaggeredList>,
    );

    expect(html).toContain("<ol");
    expect(html).toContain("<li");
    expect(html).toContain("Alpha");
    expect(html).toContain("Beta");
    expect(animateMock).not.toHaveBeenCalled();
  });
});
