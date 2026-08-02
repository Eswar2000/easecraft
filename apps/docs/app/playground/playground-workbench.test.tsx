// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("easecraft", () => ({
  AnimatedAccordion: ({
    "aria-label": ariaLabel,
    children,
    collapsible,
    getLabel,
    getValue,
    isDisabled,
    items,
    mode,
    onValueChange,
    value,
  }: {
    readonly "aria-label"?: string;
    readonly children: (item: { id: string; note: string }) => ReactNode;
    readonly collapsible?: boolean;
    readonly getLabel: (item: { id: string; label: string }) => ReactNode;
    readonly getValue: (item: { id: string }) => string;
    readonly isDisabled?: (item: { disabled?: boolean }) => boolean;
    readonly items: readonly { disabled?: boolean; id: string; label: string; note: string }[];
    readonly mode?: "single" | "multiple";
    readonly onValueChange?: (value: string | readonly string[] | undefined) => void;
    readonly value?: string | readonly string[];
  }) => {
    const openValues = new Set(Array.isArray(value) ? value : value ? [value] : []);

    return createElement(
      "div",
      { "aria-label": ariaLabel, role: "group" },
      items.map((item) => {
        const itemValue = getValue(item);
        const open = openValues.has(itemValue);

        return createElement(
          "div",
          { key: itemValue },
          createElement(
            "button",
            {
              "aria-expanded": open,
              disabled: isDisabled?.(item) ?? false,
              onClick: () => {
                if (mode === "multiple") {
                  const nextValues = open
                    ? [...openValues].filter((openValue) => openValue !== itemValue)
                    : [...openValues, itemValue];
                  onValueChange?.(nextValues);
                } else {
                  onValueChange?.(open && collapsible ? undefined : itemValue);
                }
              },
              type: "button",
            },
            getLabel(item),
          ),
          open
            ? createElement(
                "div",
                { "aria-label": `${item.label} details`, role: "region" },
                children(item),
              )
            : null,
        );
      }),
    );
  },
  AnimatedTabs: ({
    "aria-label": ariaLabel,
    children,
    className,
    getLabel,
    getValue,
    isDisabled,
    items,
    onValueChange,
    orientation,
    value,
  }: {
    readonly "aria-label"?: string;
    readonly children: (item: {
      id: string;
      label: string;
      metric: string;
      note: string;
    }) => ReactNode;
    readonly className?: string;
    readonly getLabel: (item: { id: string; label: string }) => ReactNode;
    readonly getValue: (item: { id: string }) => string;
    readonly isDisabled?: (item: { disabled?: boolean }) => boolean;
    readonly items: readonly {
      disabled?: boolean;
      id: string;
      label: string;
      metric: string;
      note: string;
    }[];
    readonly onValueChange?: (value: string) => void;
    readonly orientation?: string;
    readonly value?: string;
  }) => {
    const activeItem = items.find((item) => getValue(item) === value) ?? items[0];

    return createElement(
      "div",
      { className, "data-orientation": orientation },
      createElement(
        "div",
        { "aria-label": ariaLabel, role: "tablist" },
        items.map((item) =>
          createElement(
            "button",
            {
              "aria-selected": getValue(item) === value,
              disabled: isDisabled?.(item) ?? false,
              key: getValue(item),
              onClick: () => {
                onValueChange?.(getValue(item));
              },
              role: "tab",
              type: "button",
            },
            getLabel(item),
          ),
        ),
      ),
      activeItem ? createElement("div", { role: "tabpanel" }, children(activeItem)) : null,
    );
  },
  FilterGrid: ({
    children,
    controlsLabel,
    empty,
    filters,
    items,
    onValueChange,
    resultLabel,
    value,
  }: {
    readonly children: (
      item: { category: string; id: number; name: string; note: string },
      state: string,
    ) => ReactNode;
    readonly controlsLabel?: string;
    readonly empty?: ReactNode;
    readonly filters: readonly {
      label: ReactNode;
      matches: (item: { category: string }) => boolean;
      value: string;
    }[];
    readonly items: readonly { category: string; id: number; name: string; note: string }[];
    readonly onValueChange?: (value: string) => void;
    readonly resultLabel?: (count: number, filter: { value: string } | undefined) => ReactNode;
    readonly value?: string;
  }) => {
    const activeFilter = filters.find((filter) => filter.value === value) ?? filters[0];
    const filteredItems = activeFilter ? items.filter(activeFilter.matches) : [];

    return createElement(
      "section",
      null,
      createElement(
        "div",
        { "aria-label": controlsLabel, role: "group" },
        filters.map((filter) =>
          createElement(
            "button",
            {
              "aria-pressed": filter.value === activeFilter?.value,
              key: filter.value,
              onClick: () => {
                onValueChange?.(filter.value);
              },
              type: "button",
            },
            filter.label,
          ),
        ),
      ),
      createElement(
        "span",
        { "aria-label": "Filter results", role: "status" },
        resultLabel?.(filteredItems.length, activeFilter),
      ),
      filteredItems.length > 0
        ? createElement(
            "ul",
            null,
            filteredItems.map((item) =>
              createElement("li", { key: item.id }, children(item, "present")),
            ),
          )
        : createElement("div", null, empty),
    );
  },
  MotionDialog: ({
    children,
    closeClassName,
    title,
    trigger,
  }: {
    children: ReactNode;
    closeClassName?: string;
    title: ReactNode;
    trigger: ReactNode;
  }) =>
    createElement(
      "div",
      { "data-close-class": closeClassName },
      trigger,
      createElement("strong", null, title),
      children,
    ),
  MotionProvider: ({ children }: { children: ReactNode }) => children,
  NumberTicker: ({
    announce,
    className,
    prefix = "",
    suffix = "",
    value,
  }: {
    announce?: string;
    className?: string;
    prefix?: string;
    suffix?: string;
    value: number;
  }) =>
    createElement(
      "output",
      { className, "data-announcement": announce },
      `${prefix}${value.toString()}${suffix}`,
    ),
  ScrollReveal: ({
    as = "div",
    children,
    className,
    once,
    preset,
    rootMargin,
    threshold,
  }: {
    readonly as?: string;
    readonly children: ReactNode;
    readonly className?: string;
    readonly once?: boolean;
    readonly preset?: string;
    readonly rootMargin?: string;
    readonly threshold?: number;
  }) =>
    createElement(
      as,
      {
        className,
        "data-once": once,
        "data-preset": preset,
        "data-root-margin": rootMargin,
        "data-threshold": threshold,
      },
      children,
    ),
  StaggeredList: ({
    children,
    items,
  }: {
    children: (item: { id: string; label: string; track: string }) => ReactNode;
    items: readonly { id: string; label: string; track: string }[];
  }) =>
    createElement(
      "ol",
      null,
      items.map((item) => createElement("li", { key: item.id }, children(item))),
    ),
  TextReveal: ({ children }: { children: ReactNode }) => createElement("h2", null, children),
  ToastStack: ({
    actionClassName,
    closeClassName,
    items,
    limit,
    onDismiss,
  }: {
    readonly actionClassName?: string;
    readonly closeClassName?: string;
    readonly items: readonly {
      action?: { label: ReactNode };
      description?: ReactNode;
      id: string;
      priority?: string;
      title: ReactNode;
    }[];
    readonly limit?: number;
    readonly onDismiss: (id: string, reason: string) => void;
  }) =>
    createElement(
      "div",
      { "aria-label": "Notifications (F8)", role: "region" },
      items.slice(0, limit).map((item) =>
        createElement(
          "div",
          { "data-priority": item.priority ?? "polite", key: item.id },
          createElement("strong", null, item.title),
          createElement("span", null, item.description),
          item.action
            ? createElement(
                "button",
                {
                  className: actionClassName,
                  onClick: () => {
                    onDismiss(item.id, "action");
                  },
                  type: "button",
                },
                item.action.label,
              )
            : null,
          createElement(
            "button",
            {
              "aria-label": "Dismiss notification",
              className: closeClassName,
              onClick: () => {
                onDismiss(item.id, "close");
              },
              type: "button",
            },
            "Dismiss notification",
          ),
        ),
      ),
    ),
  defaultMotionTokens: {
    distance: { large: 24, medium: 12, small: 4 },
    duration: { fast: 180, instant: 100, normal: 300, slow: 600 },
    easing: { emphasized: "out(5)", enter: "out(3)", exit: "in(2)", move: "inOut(3)" },
    stagger: { normal: 60, relaxed: 100, tight: 25 },
  },
}));

import { PlaygroundWorkbench } from "./playground-workbench";
import {
  decodePlaygroundSearchParams,
  decodePlaygroundStorage,
  playgroundStorageKey,
  serializePlaygroundStorage,
} from "./playground-persistence";
import { getDefaultPlaygroundState, parsePlaygroundState } from "./playground-state";

const writeText = vi.fn<(value: string) => Promise<void>>();

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/playground");
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  writeText.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  writeText.mockReset();
});

describe("PlaygroundWorkbench", () => {
  it("switches components and removes controls unsupported by Motion Dialog", () => {
    const view = render(createElement(PlaygroundWorkbench));

    expect(view.getByLabelText("Delay")).toBeTruthy();
    expect(view.getByText(/<TextReveal/u)).toBeTruthy();

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "motion-dialog" } });

    expect(view.queryByLabelText("Delay")).toBeNull();
    expect(view.getByLabelText("Dismiss with Escape or backdrop")).toBeTruthy();
    expect(view.getByText(/<MotionDialog/u)).toBeTruthy();
    expect(view.queryByText(/delay=/u)).toBeNull();
  });

  it("updates generated code from validated controls", async () => {
    const view = render(createElement(PlaygroundWorkbench));
    const duration = view.getByLabelText("Duration");

    fireEvent.change(duration, { target: { value: "640" } });
    fireEvent.click(view.getByRole("button", { name: "characters" }));

    await waitFor(() => {
      const codePanel = view.getByLabelText("Generated React code");

      expect(codePanel.textContent).toContain("duration={640}");
      expect(codePanel.textContent).toContain('split="characters"');
    });
  });

  it("renders NumberTicker controls, preview, and generated values", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "number-ticker" } });

    expect(view.queryByLabelText("Distance")).toBeNull();
    expect(view.queryByText("Sequence")).toBeNull();
    expect(view.getByLabelText("Target value")).toBeTruthy();
    expect(view.getByLabelText("Start value")).toBeTruthy();
    expect(view.container.querySelector("output.playground-number-value")?.textContent).toBe(
      "$12480",
    );

    fireEvent.change(view.getByLabelText("Target value"), { target: { value: "18750" } });
    fireEvent.change(view.getByLabelText("Start value"), { target: { value: "-250" } });
    fireEvent.change(view.getByLabelText("Prefix"), { target: { value: "EUR " } });
    fireEvent.change(view.getByLabelText("Suffix"), { target: { value: " total" } });
    fireEvent.change(view.getByLabelText("Locale"), { target: { value: "de-DE" } });
    fireEvent.click(view.getByRole("button", { name: "Assertive" }));

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("<NumberTicker");
    expect(codePanel.textContent).toContain("value={18750}");
    expect(codePanel.textContent).toContain("from={-250}");
    expect(codePanel.textContent).toContain('prefix={"EUR "}');
    expect(codePanel.textContent).toContain('suffix={" total"}');
    expect(codePanel.textContent).toContain('locale={"de-DE"}');
    expect(codePanel.textContent).toContain('announce="assertive"');
    expect(view.container.querySelector("output.playground-number-value")?.textContent).toBe(
      "EUR 18750 total",
    );
  });

  it("replays NumberTicker from a fresh output instance", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "number-ticker" } });
    const initialOutput = view.container.querySelector("output.playground-number-value");
    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "720" } });
    const configuredOutput = view.container.querySelector("output.playground-number-value");

    expect(configuredOutput).not.toBe(initialOutput);

    fireEvent.click(view.getByRole("button", { name: "Replay" }));

    expect(view.container.querySelector("output.playground-number-value")).not.toBe(
      configuredOutput,
    );
  });

  it("controls Animated Tabs and persists preview selection", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "animated-tabs" } });

    expect(view.queryByLabelText("Delay")).toBeNull();
    expect(view.getByRole("tab", { name: "Overview" }).getAttribute("aria-selected")).toBe("true");
    expect((view.getByRole("tab", { name: "Permissions" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.click(view.getByRole("tab", { name: "Activity" }));
    fireEvent.click(view.getByRole("button", { name: "Manual" }));
    fireEvent.click(view.getByRole("button", { name: "Vertical" }));
    fireEvent.click(view.getByLabelText("Loop keyboard navigation"));

    expect((view.getByLabelText("Active tab") as HTMLSelectElement).value).toBe("activity");
    expect(view.getByRole("tabpanel").textContent).toContain("Changes this week");

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("<AnimatedTabs");
    expect(codePanel.textContent).toContain('defaultValue="activity"');
    expect(codePanel.textContent).toContain('activationMode="manual"');
    expect(codePanel.textContent).toContain('orientation="vertical"');
    expect(codePanel.textContent).toContain("loop={false}");
    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({
      activationMode: "manual",
      component: "animated-tabs",
      loop: false,
      orientation: "vertical",
      tab: "activity",
    });
  });

  it("controls Animated Accordion single and multiple expansion", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), {
      target: { value: "animated-accordion" },
    });

    expect(view.queryByLabelText("Delay")).toBeNull();
    expect(view.queryByLabelText("Distance")).toBeNull();
    expect(
      view.getByRole("button", { name: /Intrinsic height/u }).getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      (view.getByRole("button", { name: /Registry metadata/u }) as HTMLButtonElement).disabled,
    ).toBe(true);

    fireEvent.click(view.getByRole("button", { name: /Linked semantics/u }));
    expect(view.getByRole("region", { name: "Linked semantics details" })).toBeTruthy();
    fireEvent.click(view.getByRole("button", { name: /Linked semantics/u }));
    expect(view.queryByRole("region", { name: "Linked semantics details" })).toBeNull();

    fireEvent.click(view.getByRole("button", { name: "Multiple" }));
    expect((view.getByLabelText("Allow all panels to close") as HTMLInputElement).disabled).toBe(
      true,
    );
    fireEvent.click(view.getByRole("button", { name: /Intrinsic height/u }));
    fireEvent.click(view.getByRole("button", { name: /Linked semantics/u }));

    expect(view.getByRole("region", { name: "Intrinsic height details" })).toBeTruthy();
    expect(view.getByRole("region", { name: "Linked semantics details" })).toBeTruthy();

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("<AnimatedAccordion");
    expect(codePanel.textContent).toContain('defaultValue={["lifecycle","semantics"]}');
    expect(codePanel.textContent).toContain('mode="multiple"');
    expect(codePanel.textContent).not.toContain("collapsible=");
    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({
      accordionMode: "multiple",
      component: "animated-accordion",
      expanded: ["lifecycle", "semantics"],
    });
  });

  it("controls the Toast Stack queue, limit, and delivery settings", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "toast-stack" } });

    expect(view.queryByLabelText("Delay")).toBeNull();
    expect(view.getByRole("status", { name: "Notification queue status" }).textContent).toBe(
      "3 active / 1 queued",
    );
    expect(view.getByText("Preview published")).toBeTruthy();
    expect(view.getByText("Review required")).toBeTruthy();
    expect(view.queryByText("Registry synchronized")).toBeNull();

    fireEvent.change(view.getByLabelText("Visible limit"), { target: { value: "3" } });
    expect(view.getByText("Registry synchronized")).toBeTruthy();
    const firstDismissButton = view.getAllByRole("button", { name: "Dismiss notification" })[0];

    if (!firstDismissButton) {
      throw new Error("Expected a visible toast dismiss button");
    }

    fireEvent.click(firstDismissButton);
    expect(view.queryByText("Preview published")).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Add polite" }));
    fireEvent.change(view.getByLabelText("Auto-dismiss"), { target: { value: "12000" } });
    fireEvent.change(view.getByLabelText("Swipe direction"), { target: { value: "left" } });

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("<ToastStack");
    expect(codePanel.textContent).toContain("duration={12000}");
    expect(codePanel.textContent).toContain("limit={3}");
    expect(codePanel.textContent).toContain('swipeDirection="left"');
    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({
      component: "toast-stack",
      swipeDirection: "left",
      toastLimit: 3,
      toastTimeout: 12_000,
      toasts: ["review", "sync", "preview"],
    });

    fireEvent.click(view.getByRole("button", { name: "Clear" }));
    expect(view.getByRole("status", { name: "Notification queue status" }).textContent).toBe(
      "0 active / 0 queued",
    );
    fireEvent.click(view.getByRole("button", { name: "Add burst" }));
    expect(view.getByRole("status", { name: "Notification queue status" }).textContent).toBe(
      "4 active / 1 queued",
    );
  });

  it("filters the gallery and persists staggered layout settings", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "filter-grid" } });

    expect(view.queryByLabelText("Delay")).toBeNull();
    expect(view.getByRole("status", { name: "Filter results" }).textContent).toBe(
      "6 components / all",
    );
    expect(view.getAllByRole("listitem")).toHaveLength(6);

    fireEvent.click(view.getByRole("button", { name: "Feedback" }));
    expect(view.getByRole("status", { name: "Filter results" }).textContent).toBe(
      "2 components / feedback",
    );
    expect(view.getByRole("button", { name: "Inspect Number Ticker" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Inspect Toast Stack" })).toBeTruthy();

    fireEvent.change(view.getByLabelText("Interval"), { target: { value: "90" } });
    fireEvent.click(view.getByRole("button", { name: "rise" }));
    fireEvent.click(view.getByRole("button", { name: "reverse" }));
    fireEvent.click(view.getByRole("button", { name: "Archived" }));

    expect(view.getByRole("status", { name: "Filter results" }).textContent).toBe(
      "0 components / archived",
    );
    expect(view.getByText("No archived components.")).toBeTruthy();

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("<FilterGrid");
    expect(codePanel.textContent).toContain('defaultValue="archived"');
    expect(codePanel.textContent).toContain("interval={90}");
    expect(codePanel.textContent).toContain('order="reverse"');
    expect(codePanel.textContent).toContain('preset="rise"');
    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({
      component: "filter-grid",
      filter: "archived",
      order: "reverse",
      preset: "rise",
      stagger: 90,
    });
  });

  it("configures the bounded Scroll Reveal preview and observer settings", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "scroll-reveal" } });

    expect(view.queryByText("Sequence")).toBeNull();
    expect(view.getByRole("region", { name: "Scroll Reveal bounded viewport" })).toBeTruthy();
    expect(view.getByRole("status", { name: "Scroll Reveal observation status" }).textContent).toBe(
      "0 / 3 observed",
    );
    expect(view.container.querySelectorAll("article.playground-scroll-card")).toHaveLength(3);

    fireEvent.change(view.getByLabelText("Delay"), { target: { value: "80" } });
    fireEvent.change(view.getByLabelText("Threshold"), { target: { value: "0.4" } });
    fireEvent.click(view.getByLabelText("Reveal only once"));
    fireEvent.click(view.getByRole("button", { name: "rise" }));
    fireEvent.click(view.getByRole("button", { name: "Late" }));

    const firstReveal = view.container.querySelector("article.playground-scroll-card");
    expect(firstReveal?.getAttribute("data-once")).toBe("false");
    expect(firstReveal?.getAttribute("data-preset")).toBe("rise");
    expect(firstReveal?.getAttribute("data-root-margin")).toBe("0px 0px -30% 0px");
    expect(firstReveal?.getAttribute("data-threshold")).toBe("0.4");

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("<ScrollReveal");
    expect(codePanel.textContent).toContain("delay={80}");
    expect(codePanel.textContent).toContain("once={false}");
    expect(codePanel.textContent).toContain('preset="rise"');
    expect(codePanel.textContent).toContain('rootMargin="0px 0px -30% 0px"');
    expect(codePanel.textContent).toContain("threshold={0.4}");
    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({
      component: "scroll-reveal",
      delay: 80,
      once: false,
      preset: "rise",
      revealMargin: "late",
      threshold: 0.4,
    });
  });

  it("replays Staggered List when motion controls change", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "staggered-list" } });
    const initialList = view.getByRole("list");

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "640" } });

    expect(view.getByRole("list")).not.toBe(initialList);
  });

  it("assigns separate Motion Dialog action and close styles", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Preview"), { target: { value: "motion-dialog" } });

    expect(
      view.container.querySelector('[data-close-class="playground-dialog-close"]'),
    ).toBeTruthy();
    expect(view.getByRole("button", { name: "Approve motion" }).className).toContain(
      "playground-dialog-action",
    );
  });

  it("copies the generated code and reports success", async () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.click(view.getByRole("button", { name: "Copy generated code" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining("<TextReveal"));
      expect(view.getByRole("status", { name: "Code copy status" }).textContent).toBe(
        "Generated code copied.",
      );
    });
  });

  it("switches code templates without changing the selected motion state", () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "640" } });
    fireEvent.click(view.getByRole("button", { name: "Copy source" }));

    const codePanel = view.getByLabelText("Generated React code");
    expect(codePanel.textContent).toContain("Copy source");
    expect(codePanel.textContent).toContain("Dependencies");
    expect(codePanel.textContent).toContain("@/components/easecraft/text-reveal");
    expect(codePanel.textContent).toContain("duration={640}");

    fireEvent.click(view.getByRole("button", { name: "Token overrides" }));

    expect(codePanel.textContent).toContain("duration: { normal: 640 }");
    expect(codePanel.textContent).toContain('duration="normal"');
    expect((view.getByLabelText("Duration") as HTMLInputElement).value).toBe("640");
    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({ codeMode: "token-override", duration: 640 });
  });

  it("copies the currently selected template", async () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.click(view.getByRole("button", { name: "Copy source" }));
    fireEvent.click(view.getByRole("button", { name: "Copy generated code" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("@/components/easecraft/text-reveal"),
      );
    });
  });

  it("restores local state and persists subsequent control changes", async () => {
    window.localStorage.setItem(
      playgroundStorageKey,
      serializePlaygroundStorage(
        parsePlaygroundState({ component: "staggered-list", order: "reverse" }),
      ),
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("staggered-list");
    });

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "640" } });

    expect(
      decodePlaygroundStorage(window.localStorage.getItem(playgroundStorageKey)),
    ).toMatchObject({
      component: "staggered-list",
      duration: 640,
      order: "reverse",
    });
  });

  it("uses explicit shared state instead of stored state", () => {
    window.localStorage.setItem(
      playgroundStorageKey,
      serializePlaygroundStorage(getDefaultPlaygroundState("staggered-list")),
    );
    const shared = parsePlaygroundState({ component: "motion-dialog", dismissible: false });
    const view = render(<PlaygroundWorkbench initialState={shared} restoreFromStorage={false} />);

    expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("motion-dialog");
    expect(
      (view.getByLabelText("Dismiss with Escape or backdrop") as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("restores versioned state directly from the browser URL", async () => {
    window.localStorage.setItem(
      playgroundStorageKey,
      serializePlaygroundStorage(getDefaultPlaygroundState("staggered-list")),
    );
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=motion-dialog&codeMode=token-override&duration=720&distance=24&easing=emphasized&reducedMotion=1&viewport=mobile&contrast=ink&dismissible=0",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("motion-dialog");
    });
    expect((view.getByLabelText("Duration") as HTMLInputElement).value).toBe("720");
    expect(view.getByRole("button", { name: "Token overrides" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "duration: { normal: 720 }",
    );
    expect(
      (view.getByLabelText("Dismiss with Escape or backdrop") as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("restores NumberTicker controls and templates from a shared URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=number-ticker&codeMode=token-override&duration=720&easing=move&reducedMotion=0&viewport=mobile&contrast=ink&delay=80&from=-250&value=18750&locale=de-DE&prefix=EUR+&suffix=+total&announce=assertive",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("number-ticker");
    });

    expect((view.getByLabelText("Target value") as HTMLInputElement).value).toBe("18750");
    expect((view.getByLabelText("Start value") as HTMLInputElement).value).toBe("-250");
    expect((view.getByLabelText("Prefix") as HTMLInputElement).value).toBe("EUR ");
    expect((view.getByLabelText("Suffix") as HTMLInputElement).value).toBe(" total");
    expect((view.getByLabelText("Locale") as HTMLSelectElement).value).toBe("de-DE");
    expect(view.getByRole("button", { name: "Assertive" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "duration: { normal: 720 }",
    );
  });

  it("restores Animated Tabs behavior and templates from a shared URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=animated-tabs&codeMode=copy-source&duration=640&distance=8&easing=move&reducedMotion=0&viewport=mobile&contrast=ink&activationMode=manual&orientation=vertical&loop=0&tab=metrics",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("animated-tabs");
    });

    expect((view.getByLabelText("Active tab") as HTMLSelectElement).value).toBe("metrics");
    expect(view.getByRole("button", { name: "Manual" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("button", { name: "Vertical" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect((view.getByLabelText("Loop keyboard navigation") as HTMLInputElement).checked).toBe(
      false,
    );
    expect(view.getByRole("tab", { name: "Metrics" }).getAttribute("aria-selected")).toBe("true");
    expect(view.getByRole("tabpanel").textContent).toContain("Accessibility score");
    expect(view.getByRole("button", { name: "Copy source" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "@/components/easecraft/animated-tabs",
    );
  });

  it("restores Animated Accordion expansion and templates from a shared URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=animated-accordion&codeMode=copy-source&duration=640&easing=enter&reducedMotion=0&viewport=mobile&contrast=ink&accordionMode=multiple&collapsible=0&expanded=lifecycle,interruption",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe(
        "animated-accordion",
      );
    });

    expect(view.getByRole("button", { name: "Multiple" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect((view.getByLabelText("Allow all panels to close") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(view.getByRole("region", { name: "Intrinsic height details" })).toBeTruthy();
    expect(view.getByRole("region", { name: "Rapid reversal details" })).toBeTruthy();
    expect(view.queryByRole("region", { name: "Linked semantics details" })).toBeNull();
    expect(view.getByRole("button", { name: "Copy source" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "@/components/easecraft/animated-accordion",
    );
  });

  it("restores a Toast Stack queue and templates from a shared URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=toast-stack&codeMode=copy-source&duration=640&distance=24&easing=emphasized&reducedMotion=0&viewport=mobile&contrast=ink&toastLimit=1&toastTimeout=12000&swipeDirection=left&toasts=review,tokens",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("toast-stack");
    });

    expect((view.getByLabelText("Visible limit") as HTMLInputElement).value).toBe("1");
    expect((view.getByLabelText("Auto-dismiss") as HTMLInputElement).value).toBe("12000");
    expect((view.getByLabelText("Swipe direction") as HTMLSelectElement).value).toBe("left");
    expect(view.getByRole("status", { name: "Notification queue status" }).textContent).toBe(
      "2 active / 1 queued",
    );
    expect(view.getByText("Review required")).toBeTruthy();
    expect(view.queryByText("Tokens updated")).toBeNull();
    expect(view.getByRole("button", { name: "Copy source" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "@/components/easecraft/toast-stack",
    );

    fireEvent.click(view.getByRole("button", { name: "Review" }));
    expect(view.queryByText("Review required")).toBeNull();
    expect(view.getByText("Tokens updated")).toBeTruthy();
  });

  it("restores Filter Grid selection and templates from a shared URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=filter-grid&codeMode=copy-source&duration=640&distance=24&easing=emphasized&reducedMotion=0&viewport=mobile&contrast=ink&filter=feedback&stagger=90&preset=rise&order=reverse",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("filter-grid");
    });

    expect(view.getByRole("button", { name: "Feedback" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByRole("status", { name: "Filter results" }).textContent).toBe(
      "2 components / feedback",
    );
    expect((view.getByLabelText("Interval") as HTMLInputElement).value).toBe("90");
    expect(view.getByRole("button", { name: "rise" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("button", { name: "reverse" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("button", { name: "Copy source" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "@/components/easecraft/filter-grid",
    );
  });

  it("restores Scroll Reveal observer settings and templates from a shared URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/playground?v=1&component=scroll-reveal&codeMode=copy-source&duration=640&distance=24&easing=emphasized&reducedMotion=0&viewport=mobile&contrast=ink&delay=80&preset=rise&once=0&threshold=0.4&revealMargin=late",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("scroll-reveal");
    });

    expect((view.getByLabelText("Delay") as HTMLInputElement).value).toBe("80");
    expect((view.getByLabelText("Threshold") as HTMLInputElement).value).toBe("0.4");
    expect((view.getByLabelText("Reveal only once") as HTMLInputElement).checked).toBe(false);
    expect(view.getByRole("button", { name: "rise" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("button", { name: "Late" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("button", { name: "Copy source" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(view.getByLabelText("Generated React code").textContent).toContain(
      "@/components/easecraft/scroll-reveal",
    );
  });

  it("copies a versioned share link and keeps it synchronized", async () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "640" } });
    fireEvent.click(view.getByRole("button", { name: "Copy source" }));
    fireEvent.click(view.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(view.getByRole("status", { name: "Code copy status" }).textContent).toBe(
        "Share link copied.",
      );
    });

    const shareUrl = new URL(writeText.mock.calls.at(-1)?.[0] ?? "", window.location.origin);
    expect(shareUrl.pathname).toBe("/playground");
    expect(shareUrl.searchParams.get("v")).toBe("1");
    expect(decodePlaygroundSearchParams(shareUrl.searchParams)).toMatchObject({
      codeMode: "copy-source",
      duration: 640,
    });
    expect(window.location.search).toBe(shareUrl.search);

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "720" } });
    expect(decodePlaygroundSearchParams(new URLSearchParams(window.location.search))).toMatchObject(
      {
        duration: 720,
      },
    );
  });
});
