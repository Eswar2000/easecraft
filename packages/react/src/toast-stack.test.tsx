import { renderToString } from "react-dom/server";
import { useState } from "react";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
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

import { MotionProvider } from "./motion-provider.js";
import { ToastStack, type ToastStackDismissReason, type ToastStackItem } from "./toast-stack.js";

interface AnimationParameters {
  onComplete?: () => void;
}

const notifications = [
  { description: "Package output is ready.", id: "build", title: "Build complete" },
  {
    description: "Keyboard checks need attention.",
    id: "review",
    priority: "assertive",
    title: "Review required",
  },
  { description: "Preview is available.", id: "preview", title: "Preview published" },
] satisfies readonly ToastStackItem[];

function getContentAnimations(): AnimationParameters[] {
  return animateMock.mock.calls
    .filter(([target]) =>
      target instanceof HTMLElement ? target.hasAttribute("data-easecraft-toast-content") : false,
    )
    .map(([, parameters]) => parameters as AnimationParameters);
}

function completeContentAnimation(index: number) {
  act(() => {
    getContentAnimations()[index]?.onComplete?.();
  });
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function ControlledToastHarness({
  limit = 2,
  onDismiss,
  onPauseChange,
}: {
  limit?: number;
  onDismiss?: (id: string, reason: ToastStackDismissReason) => void;
  onPauseChange?: (id: string, paused: boolean) => void;
}) {
  const [items, setItems] = useState(() => [...notifications]);

  return (
    <ToastStack
      items={items}
      limit={limit}
      onDismiss={(id, reason) => {
        onDismiss?.(id, reason);
        setItems((current) => current.filter((item) => item.id !== id));
      }}
      {...(onPauseChange ? { onPauseChange } : {})}
    />
  );
}

beforeEach(() => {
  scopeAddMock.mockImplementation((setup: () => void) => {
    setup();
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  animateMock.mockReset();
  scopeAddMock.mockReset();
  scopeRevertMock.mockReset();
});

describe("ToastStack", () => {
  it("renders only the visible limit with semantic priority metadata", async () => {
    const view = render(<ControlledToastHarness />);

    await view.findByText("Build complete");
    expect(view.getByText("Review required")).not.toBeNull();
    expect(view.queryByText("Preview published")).toBeNull();
    expect(document.querySelectorAll("[data-easecraft-toast]")).toHaveLength(2);
    expect(
      document
        .querySelector('[data-easecraft-toast-id="string:review"]')
        ?.getAttribute("data-easecraft-toast-priority"),
    ).toBe("assertive");
    expect(view.getByRole("region").getAttribute("aria-label")).toContain("Notifications");
  });

  it("announces polite and assertive notifications with their final text", async () => {
    render(<ControlledToastHarness />);

    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      });
    });

    const polite = document.querySelector<HTMLElement>('[role="status"][aria-live="polite"]');
    const assertive = document.querySelector<HTMLElement>('[role="status"][aria-live="assertive"]');

    expect(polite?.textContent).toContain("Build complete");
    expect(polite?.textContent).toContain("Package output is ready.");
    expect(assertive?.textContent).toContain("Review required");
    expect(assertive?.textContent).toContain("Keyboard checks need attention.");
  });

  it("retains a dismissed toast through exit before showing the queued item", async () => {
    const onDismiss = vi.fn();
    const view = render(<ControlledToastHarness onDismiss={onDismiss} />);

    await view.findByText("Build complete");
    completeContentAnimation(0);
    completeContentAnimation(1);
    animateMock.mockClear();

    fireEvent.click(view.getAllByRole("button", { name: "Dismiss notification" })[0]!);

    const exitingToast = document.querySelector<HTMLElement>(
      '[data-easecraft-toast-id="string:build"]',
    );
    expect(onDismiss).toHaveBeenCalledWith("build", "close");
    expect(exitingToast?.getAttribute("data-easecraft-toast-state")).toBe("exiting");
    expect(view.queryByText("Preview published")).toBeNull();

    completeContentAnimation(0);

    await view.findByText("Preview published");
    expect(view.queryByText("Build complete")).toBeNull();
  });

  it("moves overflow through exit when the visible limit changes", async () => {
    const onDismiss = vi.fn();
    const view = render(<ToastStack items={notifications} limit={3} onDismiss={onDismiss} />);
    await view.findByText("Preview published");
    completeContentAnimation(0);
    completeContentAnimation(1);
    completeContentAnimation(2);
    animateMock.mockClear();

    view.rerender(<ToastStack items={notifications} limit={2} onDismiss={onDismiss} />);

    const overflow = document.querySelector<HTMLElement>(
      '[data-easecraft-toast-id="string:preview"]',
    );
    expect(overflow?.getAttribute("data-easecraft-toast-state")).toBe("exiting");
    expect(onDismiss).not.toHaveBeenCalled();

    completeContentAnimation(0);
    expect(view.queryByText("Preview published")).toBeNull();

    view.rerender(<ToastStack items={notifications} limit={3} onDismiss={onDismiss} />);
    await view.findByText("Preview published");
    expect(
      document
        .querySelector('[data-easecraft-toast-id="string:preview"]')
        ?.getAttribute("data-easecraft-toast-state"),
    ).toBe("entering");
  });

  it("reports action dismissal and invokes the action callback", async () => {
    const action = vi.fn();
    const onDismiss = vi.fn();
    const item: ToastStackItem = {
      action: { altText: "Undo archive", label: "Undo", onClick: action },
      id: "archive",
      title: "Item archived",
    };
    const view = render(<ToastStack items={[item]} onDismiss={onDismiss} />);

    await view.findByText("Item archived");
    fireEvent.click(view.getByRole("button", { name: "Undo" }));

    expect(action).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("archive", "action");
  });

  it("forwards viewport pause and resume behavior for hover and focus", async () => {
    const onPauseChange = vi.fn();
    const view = render(<ControlledToastHarness onPauseChange={onPauseChange} />);
    const region = await view.findByRole("region");

    fireEvent.pointerMove(region);
    expect(onPauseChange).toHaveBeenCalledWith("build", true);
    expect(onPauseChange).toHaveBeenCalledWith("review", true);

    fireEvent.pointerLeave(region);
    expect(onPauseChange).toHaveBeenCalledWith("build", false);
    expect(onPauseChange).toHaveBeenCalledWith("review", false);

    view.getAllByRole("button", { name: "Dismiss notification" })[0]?.focus();
    expect(onPauseChange).toHaveBeenCalledWith("build", true);

    fireEvent.focusOut(region, { relatedTarget: document.body });
    window.dispatchEvent(new Event("blur"));
    expect(onPauseChange).toHaveBeenCalledWith("build", true);
    window.dispatchEvent(new Event("focus"));
    expect(onPauseChange).toHaveBeenCalledWith("build", false);
  });

  it("pauses auto-dismiss while hovered and resumes the remaining timer", async () => {
    const onDismiss = vi.fn();
    const view = render(
      <ToastStack
        duration={250}
        items={[{ id: "timer", title: "Timed notification" }]}
        onDismiss={onDismiss}
      />,
    );
    const region = await view.findByRole("region");

    fireEvent.pointerMove(region);
    await act(async () => {
      await wait(300);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.pointerLeave(region);
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("timer", "timeout");
    });
  });

  it("reports a completed pointer swipe as its dismissal reason", async () => {
    const onDismiss = vi.fn();
    const view = render(
      <ToastStack
        items={[{ id: "swipe", title: "Swipe notification" }]}
        onDismiss={onDismiss}
        swipeThreshold={20}
      />,
    );
    await view.findByText("Swipe notification");
    const toast = document.querySelector<HTMLElement>('[data-easecraft-toast-id="string:swipe"]');

    if (!toast) {
      throw new Error("Expected the swipe toast");
    }

    Object.defineProperties(toast, {
      hasPointerCapture: { configurable: true, value: () => true },
      releasePointerCapture: { configurable: true, value: () => undefined },
      setPointerCapture: { configurable: true, value: () => undefined },
    });
    fireEvent.pointerDown(toast, {
      button: 0,
      clientX: 0,
      clientY: 0,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerMove(toast, {
      clientX: 60,
      clientY: 0,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerUp(toast, {
      clientX: 60,
      clientY: 0,
      pointerId: 1,
      pointerType: "touch",
    });

    expect(onDismiss).toHaveBeenCalledWith("swipe", "swipe");
  });

  it("animates measured stack reflow after an exit completes", async () => {
    const view = render(<ControlledToastHarness />);
    await view.findByText("Build complete");
    const firstToast = document.querySelector<HTMLElement>(
      '[data-easecraft-toast-id="string:build"]',
    );
    const secondToast = document.querySelector<HTMLElement>(
      '[data-easecraft-toast-id="string:review"]',
    );

    if (!firstToast || !secondToast) {
      throw new Error("Expected both visible toasts");
    }

    let moved = false;
    vi.spyOn(firstToast, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(0, 0, 300, 60),
    );
    vi.spyOn(secondToast, "getBoundingClientRect").mockImplementation(
      () => new DOMRect(0, moved ? 0 : 70, 300, 60),
    );
    completeContentAnimation(0);
    completeContentAnimation(1);
    animateMock.mockClear();

    fireEvent.click(view.getAllByRole("button", { name: "Dismiss notification" })[0]!);
    moved = true;
    completeContentAnimation(0);

    const secondContent = secondToast.querySelector<HTMLElement>("[data-easecraft-toast-content]");
    expect(animateMock).toHaveBeenCalledWith(secondContent, {
      duration: 300,
      ease: "inOut(3)",
      x: [0, 0],
      y: [70, 0],
    });
  });

  it("settles entry and exit immediately under reduced motion", async () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <ControlledToastHarness limit={1} />
      </MotionProvider>,
    );

    const title = await view.findByText("Build complete");
    await waitFor(() => {
      expect(title.closest("li")?.getAttribute("data-easecraft-toast-state")).toBe("present");
    });
    expect(animateMock).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole("button", { name: "Dismiss notification" }));

    await view.findByText("Review required");
    expect(view.queryByText("Build complete")).toBeNull();
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      render(
        <ToastStack
          items={[
            { id: "duplicate", title: "First" },
            { id: "duplicate", title: "Second" },
          ]}
          onDismiss={() => undefined}
        />,
      ),
    ).toThrow("ToastStack received a duplicate id: duplicate");
  });

  it("renders a server-safe notification viewport", () => {
    const html = renderToString(<ToastStack items={notifications} onDismiss={() => undefined} />);

    expect(html).toContain("data-easecraft-toast-viewport");
    expect(animateMock).not.toHaveBeenCalled();
  });
});
