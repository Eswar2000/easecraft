// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("easecraft", () => ({
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
