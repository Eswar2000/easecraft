import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { animateMock, scopeAddMock, scopeRevertMock } = vi.hoisted(() => ({
  animateMock: vi.fn(),
  scopeAddMock: vi.fn(),
  scopeRevertMock: vi.fn(),
}));

vi.mock("animejs/animation", async (importOriginal) => {
  const animationModule = await importOriginal<typeof import("animejs/animation")>();

  return { ...animationModule, animate: animateMock };
});

vi.mock("animejs/scope", () => ({
  createScope: vi.fn(() => ({ add: scopeAddMock, revert: scopeRevertMock })),
}));

import { AnimatedAccordion } from "./animated-accordion.js";
import { MotionProvider } from "./motion-provider.js";

interface AccordionItem {
  readonly disabled?: boolean;
  readonly label: string;
  readonly panel: string;
  readonly value: "overview" | "disabled" | "activity";
}

interface AnimationParameters {
  readonly duration?: number;
  readonly ease?: string;
  readonly height?: number | readonly number[];
  readonly onComplete?: () => void;
  readonly opacity?: number | readonly number[];
}

const items = [
  { label: "Overview", panel: "Overview panel", value: "overview" },
  { disabled: true, label: "Disabled", panel: "Disabled panel", value: "disabled" },
  { label: "Activity", panel: "Activity panel", value: "activity" },
] satisfies readonly AccordionItem[];

function getLabel(item: AccordionItem) {
  return item.label;
}

function getValue(item: AccordionItem) {
  return item.value;
}

function isDisabled(item: AccordionItem) {
  return item.disabled ?? false;
}

function renderAccordion(
  props: Partial<{
    collapsible: boolean;
    defaultValue: AccordionItem["value"];
    value: AccordionItem["value"];
  }> = {},
) {
  return render(
    <AnimatedAccordion
      aria-label="Project details"
      getLabel={getLabel}
      getValue={getValue}
      isDisabled={isDisabled}
      items={items}
      {...props}
    >
      {(item) => item.panel}
    </AnimatedAccordion>,
  );
}

function getContent(view: ReturnType<typeof render>, name: string) {
  const trigger = view.getByRole("button", { name });
  const contentId = trigger.getAttribute("aria-controls");

  if (!contentId) {
    throw new Error(`Expected ${name} to control accordion content`);
  }

  const content = document.getElementById(contentId);

  if (!content) {
    throw new Error(`Expected accordion content with id ${contentId}`);
  }

  return content;
}

function setPanelHeight(content: HTMLElement, height: number) {
  const body = content.querySelector<HTMLElement>("[data-easecraft-accordion-body]");

  if (!body) {
    throw new Error("Expected an accordion body");
  }

  Object.defineProperty(body, "scrollHeight", { configurable: true, value: height });
}

function completeAnimationFor(element: HTMLElement) {
  const call = animateMock.mock.calls.find(([target]) => target === element);
  const parameters = call?.[1] as AnimationParameters | undefined;

  act(() => {
    parameters?.onComplete?.();
  });
}

beforeEach(() => {
  scopeAddMock.mockImplementation((setup: () => void) => {
    setup();
  });
});

afterEach(() => {
  cleanup();
  animateMock.mockReset();
  scopeAddMock.mockReset();
  scopeRevertMock.mockReset();
});

describe("AnimatedAccordion", () => {
  it("renders linked WAI-ARIA triggers, headings, regions, and disabled state", () => {
    const view = renderAccordion({ defaultValue: "overview" });
    const overviewTrigger = view.getByRole("button", { name: "Overview" });
    const disabledTrigger = view.getByRole("button", { name: "Disabled" });
    const overviewRegion = view.getByRole("region", { name: "Overview" });
    const activityContent = getContent(view, "Activity");

    expect(view.getByRole("group", { name: "Project details" })).toBeTruthy();
    expect(overviewTrigger.closest("h3")).toBeTruthy();
    expect(overviewTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(overviewTrigger.getAttribute("aria-controls")).toBe(overviewRegion.id);
    expect(overviewRegion.getAttribute("aria-labelledby")).toBe(overviewTrigger.id);
    expect((disabledTrigger as HTMLButtonElement).disabled).toBe(true);
    expect(activityContent.hidden).toBe(true);
    expect(activityContent.dataset["easecraftState"]).toBe("closed");
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("animates intrinsic height while switching a single uncontrolled item", () => {
    const onValueChange = vi.fn();
    const view = render(
      <AnimatedAccordion
        defaultValue="overview"
        getLabel={getLabel}
        getValue={getValue}
        items={items}
        onValueChange={onValueChange}
      >
        {(item) => item.panel}
      </AnimatedAccordion>,
    );
    const overviewContent = getContent(view, "Overview");
    const activityContent = getContent(view, "Activity");
    setPanelHeight(overviewContent, 120);
    setPanelHeight(activityContent, 180);

    fireEvent.click(view.getByRole("button", { name: "Activity" }));

    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(overviewContent.dataset["easecraftState"]).toBe("closing");
    expect(overviewContent.getAttribute("aria-hidden")).toBe("true");
    expect(activityContent.dataset["easecraftState"]).toBe("opening");
    expect(activityContent.hidden).toBe(false);
    expect(animateMock).toHaveBeenCalledWith(
      overviewContent,
      expect.objectContaining({
        duration: 180,
        ease: "in(2)",
        height: [120, 0],
        opacity: 0,
      }),
    );
    expect(animateMock).toHaveBeenCalledWith(
      activityContent,
      expect.objectContaining({
        duration: 300,
        ease: "out(3)",
        height: [0, 180],
        opacity: [0, 1],
      }),
    );

    completeAnimationFor(overviewContent);
    completeAnimationFor(activityContent);

    expect(overviewContent.hidden).toBe(true);
    expect(activityContent.dataset["easecraftState"]).toBe("open");
    expect(view.getByRole("region", { name: "Activity" }).textContent).toBe("Activity panel");
  });

  it("reports controlled changes without changing the expanded item", () => {
    const onValueChange = vi.fn();
    const view = render(
      <AnimatedAccordion
        getLabel={getLabel}
        getValue={getValue}
        items={items}
        onValueChange={onValueChange}
        value="overview"
      >
        {(item) => item.panel}
      </AnimatedAccordion>,
    );

    fireEvent.click(view.getByRole("button", { name: "Activity" }));

    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(view.getByRole("button", { name: "Overview" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(view.getByRole("button", { name: "Activity" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("keeps an explicitly controlled undefined value fully collapsed", () => {
    const onValueChange = vi.fn();
    const view = render(
      <AnimatedAccordion<AccordionItem, AccordionItem["value"]>
        defaultValue="overview"
        getLabel={getLabel}
        getValue={getValue}
        items={items}
        onValueChange={onValueChange}
        value={undefined}
      >
        {(item) => item.panel}
      </AnimatedAccordion>,
    );

    expect(view.getByRole("button", { name: "Overview" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(view.getByRole("button", { name: "Activity" }).getAttribute("aria-expanded")).toBe(
      "false",
    );

    fireEvent.click(view.getByRole("button", { name: "Activity" }));

    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(view.getByRole("button", { name: "Activity" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
  });

  it("supports multiple expanded items", () => {
    const onValueChange = vi.fn();
    const view = render(
      <AnimatedAccordion
        defaultValue={["overview"]}
        getLabel={getLabel}
        getValue={getValue}
        items={items}
        mode="multiple"
        onValueChange={onValueChange}
      >
        {(item) => item.panel}
      </AnimatedAccordion>,
    );

    fireEvent.click(view.getByRole("button", { name: "Activity" }));

    expect(onValueChange).toHaveBeenCalledWith(["overview", "activity"]);
    expect(view.getByRole("button", { name: "Overview" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(view.getByRole("button", { name: "Activity" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("moves focus with arrows, Home, and End while skipping disabled items", () => {
    const view = renderAccordion();
    const overviewTrigger = view.getByRole("button", { name: "Overview" });
    const activityTrigger = view.getByRole("button", { name: "Activity" });

    overviewTrigger.focus();
    fireEvent.keyDown(overviewTrigger, { key: "ArrowDown" });
    expect(document.activeElement).toBe(activityTrigger);

    fireEvent.keyDown(activityTrigger, { key: "Home" });
    expect(document.activeElement).toBe(overviewTrigger);

    fireEvent.keyDown(overviewTrigger, { key: "End" });
    expect(document.activeElement).toBe(activityTrigger);

    fireEvent.keyDown(activityTrigger, { key: "ArrowDown" });
    expect(document.activeElement).toBe(overviewTrigger);
  });

  it("ignores a stale opening completion after a rapid collapse", () => {
    const view = renderAccordion();
    const trigger = view.getByRole("button", { name: "Overview" });
    const content = getContent(view, "Overview");
    setPanelHeight(content, 140);

    fireEvent.click(trigger);
    const openingParameters = animateMock.mock.calls[0]?.[1] as AnimationParameters;
    fireEvent.click(trigger);

    expect(content.dataset["easecraftState"]).toBe("closing");

    act(() => {
      openingParameters.onComplete?.();
    });

    expect(content.dataset["easecraftState"]).toBe("closing");
    expect(content.style.overflow).toBe("hidden");

    const closingParameters = animateMock.mock.calls[1]?.[1] as AnimationParameters;
    act(() => {
      closingParameters.onComplete?.();
    });

    expect(content.dataset["easecraftState"]).toBe("closed");
    expect(content.hidden).toBe(true);
  });

  it("moves focus to the trigger when controlled content begins closing", () => {
    const renderComponent = (value: AccordionItem["value"]) => (
      <AnimatedAccordion getLabel={getLabel} getValue={getValue} items={items} value={value}>
        {(item) =>
          item.value === "overview" ? <button type="button">Panel action</button> : item.panel
        }
      </AnimatedAccordion>
    );
    const view = render(renderComponent("overview"));
    const panelAction = view.getByRole("button", { name: "Panel action" });
    const overviewTrigger = view.getByRole("button", { name: "Overview" });
    panelAction.focus();

    view.rerender(renderComponent("activity"));

    expect(document.activeElement).toBe(overviewTrigger);
  });

  it("settles item changes immediately under reduced motion", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedAccordion
          defaultValue="overview"
          getLabel={getLabel}
          getValue={getValue}
          items={items}
        >
          {(item) => item.panel}
        </AnimatedAccordion>
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Activity" }));

    expect(getContent(view, "Overview").hidden).toBe(true);
    expect(getContent(view, "Activity").dataset["easecraftState"]).toBe("open");
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("forwards polymorphic host attributes and refs", () => {
    const sectionRef = createRef<HTMLElement>();
    const view = render(
      <AnimatedAccordion
        aria-label="Project details"
        as="section"
        className="project-accordion"
        getLabel={getLabel}
        getValue={getValue}
        items={items}
        ref={sectionRef}
      >
        {(item) => item.panel}
      </AnimatedAccordion>,
    );

    expect(sectionRef.current).toBe(view.container.firstElementChild);
    expect(sectionRef.current?.className).toBe("project-accordion");
    expect(sectionRef.current?.getAttribute("aria-label")).toBe("Project details");
  });

  it("rejects duplicate item values", () => {
    expect(() =>
      render(
        <AnimatedAccordion
          getLabel={getLabel}
          getValue={() => "duplicate"}
          items={items.slice(0, 2)}
        >
          {(item) => item.panel}
        </AnimatedAccordion>,
      ),
    ).toThrow("AnimatedAccordion received a duplicate value: duplicate");
  });

  it("renders the default semantic state on the server without animation", () => {
    const html = renderToString(
      <AnimatedAccordion
        defaultValue="activity"
        getLabel={getLabel}
        getValue={getValue}
        items={items}
      >
        {(item) => item.panel}
      </AnimatedAccordion>,
    );

    expect(html).toContain("<h3");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('role="region"');
    expect(html).toContain("Activity panel");
    expect(html).toContain('hidden=""');
    expect(animateMock).not.toHaveBeenCalled();
  });
});
