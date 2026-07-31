// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("easecraft", () => ({
  MotionDialog: ({
    children,
    title,
    trigger,
  }: {
    children: ReactNode;
    title: ReactNode;
    trigger: ReactNode;
  }) => createElement("div", null, trigger, createElement("strong", null, title), children),
  MotionProvider: ({ children }: { children: ReactNode }) => children,
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

const writeText = vi.fn<(value: string) => Promise<void>>();

beforeEach(() => {
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
});
