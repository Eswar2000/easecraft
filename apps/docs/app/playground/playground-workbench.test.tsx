// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("easecraft", () => ({
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
      "/playground?v=1&component=motion-dialog&duration=720&distance=24&easing=emphasized&reducedMotion=1&viewport=mobile&contrast=ink&dismissible=0",
    );
    const view = render(createElement(PlaygroundWorkbench));

    await waitFor(() => {
      expect((view.getByLabelText("Preview") as HTMLSelectElement).value).toBe("motion-dialog");
    });
    expect((view.getByLabelText("Duration") as HTMLInputElement).value).toBe("720");
    expect(
      (view.getByLabelText("Dismiss with Escape or backdrop") as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("copies a versioned share link and keeps it synchronized", async () => {
    const view = render(createElement(PlaygroundWorkbench));

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "640" } });
    fireEvent.click(view.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(view.getByRole("status", { name: "Code copy status" }).textContent).toBe(
        "Share link copied.",
      );
    });

    const shareUrl = new URL(writeText.mock.calls.at(-1)?.[0] ?? "", window.location.origin);
    expect(shareUrl.pathname).toBe("/playground");
    expect(shareUrl.searchParams.get("v")).toBe("1");
    expect(decodePlaygroundSearchParams(shareUrl.searchParams)).toMatchObject({ duration: 640 });
    expect(window.location.search).toBe(shareUrl.search);

    fireEvent.change(view.getByLabelText("Duration"), { target: { value: "720" } });
    expect(decodePlaygroundSearchParams(new URLSearchParams(window.location.search))).toMatchObject(
      {
        duration: 720,
      },
    );
  });
});
