import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, fireEvent, render } from "@testing-library/react";
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

import { AnimatedTabs } from "./animated-tabs.js";
import { MotionProvider } from "./motion-provider.js";

interface TabItem {
  disabled?: boolean;
  label: string;
  panel: string;
  value: string;
}

const tabs = [
  { label: "Overview", panel: "Overview panel", value: "overview" },
  { disabled: true, label: "Disabled", panel: "Disabled panel", value: "disabled" },
  { label: "Activity", panel: "Activity panel", value: "activity" },
] satisfies readonly TabItem[];

function renderTabs(
  props: Partial<{
    activationMode: "automatic" | "manual";
    defaultValue: string;
    loop: boolean;
    orientation: "horizontal" | "vertical";
    value: string;
  }> = {},
) {
  return render(
    <AnimatedTabs
      aria-label="Project views"
      getLabel={(tab: TabItem) => tab.label}
      getValue={(tab: TabItem) => tab.value}
      isDisabled={(tab: TabItem) => tab.disabled ?? false}
      items={tabs}
      {...props}
    >
      {(tab) => tab.panel}
    </AnimatedTabs>,
  );
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

describe("AnimatedTabs", () => {
  it("renders linked WAI-ARIA tabs and the initial panel", () => {
    const view = renderTabs();
    const tabList = view.getByRole("tablist", { name: "Project views" });
    const overviewTab = view.getByRole("tab", { name: "Overview" });
    const disabledTab = view.getByRole("tab", { name: "Disabled" });
    const panel = view.getByRole("tabpanel");

    expect(tabList.getAttribute("aria-orientation")).toBe("horizontal");
    expect(overviewTab.getAttribute("aria-selected")).toBe("true");
    expect(overviewTab.tabIndex).toBe(0);
    expect((disabledTab as HTMLButtonElement).disabled).toBe(true);
    expect(disabledTab.getAttribute("aria-disabled")).toBe("true");
    expect(panel.textContent).toBe("Overview panel");
    expect(overviewTab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(overviewTab.id);
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("automatically selects with horizontal arrows and skips disabled tabs", () => {
    const view = renderTabs();
    const overviewTab = view.getByRole("tab", { name: "Overview" });

    overviewTab.focus();
    fireEvent.keyDown(overviewTab, { key: "ArrowRight" });

    const activityTab = view.getByRole("tab", { name: "Activity" });
    expect(document.activeElement).toBe(activityTab);
    expect(activityTab.getAttribute("aria-selected")).toBe("true");
    expect(view.getByRole("tabpanel").textContent).toBe("Activity panel");

    fireEvent.keyDown(activityTab, { key: "ArrowRight" });
    expect(document.activeElement).toBe(overviewTab);
    expect(overviewTab.getAttribute("aria-selected")).toBe("true");
  });

  it("supports vertical manual activation with Home, End, Enter, and Space", () => {
    const view = renderTabs({ activationMode: "manual", orientation: "vertical" });
    const overviewTab = view.getByRole("tab", { name: "Overview" });
    const activityTab = view.getByRole("tab", { name: "Activity" });

    overviewTab.focus();
    fireEvent.keyDown(overviewTab, { key: "ArrowDown" });
    expect(document.activeElement).toBe(activityTab);
    expect(overviewTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(activityTab, { key: "Enter" });
    expect(activityTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(activityTab, { key: "Home" });
    expect(document.activeElement).toBe(overviewTab);
    fireEvent.keyDown(overviewTab, { key: " " });
    expect(overviewTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(overviewTab, { key: "End" });
    expect(document.activeElement).toBe(activityTab);
  });

  it("stops at the first and last enabled tabs when looping is disabled", () => {
    const view = renderTabs({ loop: false });
    const overviewTab = view.getByRole("tab", { name: "Overview" });
    const activityTab = view.getByRole("tab", { name: "Activity" });

    overviewTab.focus();
    fireEvent.keyDown(overviewTab, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(overviewTab);

    activityTab.focus();
    fireEvent.keyDown(activityTab, { key: "ArrowRight" });
    expect(document.activeElement).toBe(activityTab);
  });

  it("reports controlled changes without changing the rendered panel", () => {
    const onValueChange = vi.fn();
    const view = render(
      <AnimatedTabs
        aria-label="Project views"
        getLabel={(tab: TabItem) => tab.label}
        getValue={(tab: TabItem) => tab.value}
        items={tabs}
        onValueChange={onValueChange}
        value="overview"
      >
        {(tab) => tab.panel}
      </AnimatedTabs>,
    );

    fireEvent.click(view.getByRole("tab", { name: "Activity" }));

    expect(onValueChange).toHaveBeenCalledWith("activity");
    expect(view.getByRole("tabpanel").textContent).toBe("Overview panel");
  });

  it("animates selection changes and reverts an interrupted scope", () => {
    const view = renderTabs();
    const activityTab = view.getByRole("tab", { name: "Activity" });

    Object.defineProperties(activityTab, {
      offsetHeight: { configurable: true, value: 40 },
      offsetLeft: { configurable: true, value: 120 },
      offsetTop: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 90 },
    });

    fireEvent.click(activityTab);

    expect(animateMock).toHaveBeenCalledTimes(2);
    expect(animateMock.mock.calls[0]?.[1]).toMatchObject({
      duration: 300,
      ease: "inOut(3)",
      height: 2,
      width: 90,
      x: 120,
      y: 38,
    });
    expect(animateMock.mock.calls[1]?.[1]).toMatchObject({
      duration: 300,
      ease: "out(3)",
      opacity: [0, 1],
      x: [4, 0],
    });

    fireEvent.click(view.getByRole("tab", { name: "Overview" }));

    expect(scopeRevertMock).toHaveBeenCalled();
    expect(view.getByRole("tabpanel").textContent).toBe("Overview panel");
  });

  it("repositions without panel animation when only orientation changes", () => {
    const view = renderTabs({ orientation: "horizontal" });

    view.rerender(
      <AnimatedTabs
        aria-label="Project views"
        getLabel={(tab: TabItem) => tab.label}
        getValue={(tab: TabItem) => tab.value}
        isDisabled={(tab: TabItem) => tab.disabled ?? false}
        items={tabs}
        orientation="vertical"
      >
        {(tab) => tab.panel}
      </AnimatedTabs>,
    );

    expect(animateMock).not.toHaveBeenCalled();
    expect(view.container.firstElementChild?.getAttribute("data-orientation")).toBe("vertical");
  });

  it("switches immediately without animation under reduced motion", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedTabs
          aria-label="Project views"
          getLabel={(tab: TabItem) => tab.label}
          getValue={(tab: TabItem) => tab.value}
          items={tabs}
        >
          {(tab) => tab.panel}
        </AnimatedTabs>
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("tab", { name: "Activity" }));

    expect(view.getByRole("tabpanel").textContent).toBe("Activity panel");
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("forwards host props and refs", () => {
    const sectionRef = createRef<HTMLElement>();
    const view = render(
      <AnimatedTabs
        as="section"
        className="project-tabs"
        getLabel={(tab: TabItem) => tab.label}
        getValue={(tab: TabItem) => tab.value}
        items={tabs}
        ref={sectionRef}
      >
        {(tab) => tab.panel}
      </AnimatedTabs>,
    );

    expect(sectionRef.current).toBe(view.container.firstElementChild);
    expect(sectionRef.current?.className).toBe("project-tabs");
  });

  it("rejects duplicate values", () => {
    expect(() =>
      render(
        <AnimatedTabs
          getLabel={(tab: TabItem) => tab.label}
          getValue={() => "duplicate"}
          items={tabs.slice(0, 2)}
        >
          {(tab) => tab.panel}
        </AnimatedTabs>,
      ),
    ).toThrow("AnimatedTabs received a duplicate value: duplicate");
  });

  it("renders the selected semantic panel on the server", () => {
    const html = renderToString(
      <AnimatedTabs
        defaultValue="activity"
        getLabel={(tab: TabItem) => tab.label}
        getValue={(tab: TabItem) => tab.value}
        items={tabs}
      >
        {(tab) => tab.panel}
      </AnimatedTabs>,
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("Activity panel");
    expect(animateMock).not.toHaveBeenCalled();
  });
});
