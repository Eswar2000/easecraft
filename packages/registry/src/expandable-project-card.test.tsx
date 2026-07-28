// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { ExpandableProjectCard } from "../source/compositions/expandable-project-card.package.js";

const project = {
  id: "easecraft",
  meta: "React / Anime.js",
  status: "Active",
  summary: "Accessible motion components and copyable compositions.",
  title: "Easecraft",
} as const;

afterEach(() => {
  cleanup();
});

describe("ExpandableProjectCard", () => {
  it("renders an article with one linked disclosure and hidden initial details", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <ExpandableProjectCard
          actions={<a href="/projects/easecraft">Open project</a>}
          project={project}
        >
          <p>Project details</p>
        </ExpandableProjectCard>
      </MotionProvider>,
    );
    const article = view.container.querySelector("article");
    const trigger = view.getByRole("button", { name: /Easecraft/ });
    const contentId = trigger.getAttribute("aria-controls");

    expect(article?.getAttribute("data-project-id")).toBe("easecraft");
    expect(trigger.closest("h3")).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(contentId).toBeTruthy();
    expect(document.getElementById(contentId ?? "")?.hidden).toBe(true);
    expect(view.queryByRole("link", { name: "Open project" })).toBeNull();
  });

  it("expands uncontrolled details and exposes project actions", () => {
    const onExpandedChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <ExpandableProjectCard
          actions={<a href="/projects/easecraft">Open project</a>}
          onExpandedChange={onExpandedChange}
          project={project}
        >
          <p>Project details</p>
        </ExpandableProjectCard>
      </MotionProvider>,
    );
    const trigger = view.getByRole("button", { name: /Easecraft/ });

    fireEvent.click(trigger);

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(view.getByText("Project details")).toBeTruthy();
    expect(view.getByRole("link", { name: "Open project" })).toBeTruthy();
  });

  it("reports controlled changes without changing rendered expansion", () => {
    const onExpandedChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <ExpandableProjectCard
          expanded={false}
          onExpandedChange={onExpandedChange}
          project={project}
        >
          <p>Project details</p>
        </ExpandableProjectCard>
      </MotionProvider>,
    );
    const trigger = view.getByRole("button", { name: /Easecraft/ });

    fireEvent.click(trigger);

    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("moves focus from an action to the trigger on controlled collapse", () => {
    const renderCard = (expanded: boolean) => (
      <MotionProvider reducedMotion="always">
        <ExpandableProjectCard
          actions={<button type="button">Archive project</button>}
          expanded={expanded}
          project={project}
        >
          <p>Project details</p>
        </ExpandableProjectCard>
      </MotionProvider>
    );
    const view = render(renderCard(true));
    const action = view.getByRole("button", { name: "Archive project" });
    const trigger = view.getByRole("button", { name: /Easecraft/ });
    action.focus();

    view.rerender(renderCard(false));

    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
