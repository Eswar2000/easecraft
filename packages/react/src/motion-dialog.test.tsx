import { createRef, useState } from "react";
import { renderToString } from "react-dom/server";
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

import { MotionDialog } from "./motion-dialog.js";
import { MotionProvider } from "./motion-provider.js";

interface AnimationParameters {
  onComplete?: () => void;
}

function getContentAnimations(): AnimationParameters[] {
  return animateMock.mock.calls
    .filter(([target]) =>
      target instanceof HTMLElement ? target.hasAttribute("data-easecraft-dialog-content") : false,
    )
    .map(([, parameters]) => parameters as AnimationParameters);
}

function completeContentAnimation(index: number) {
  act(() => {
    getContentAnimations()[index]?.onComplete?.();
  });
}

function renderDialog(
  props: Partial<{
    defaultOpen: boolean;
    dismissible: boolean;
    onAfterClose: () => void;
    onAfterOpen: () => void;
    onOpenChange: (open: boolean) => void;
    open: boolean;
  }> = {},
) {
  return render(
    <MotionDialog
      description="Review the pending release."
      title="Publish release"
      trigger={<button type="button">Open dialog</button>}
      {...props}
    >
      <button type="button">Confirm publish</button>
    </MotionDialog>,
  );
}

function ControlledDialogHarness({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <MotionDialog
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        setOpen(nextOpen);
      }}
      open={open}
      title="Publish release"
      trigger={<button type="button">Open dialog</button>}
    >
      <button type="button">Confirm publish</button>
    </MotionDialog>
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

describe("MotionDialog", () => {
  it("clears a stale hidden animation frame when entry reaches open", async () => {
    animateMock.mockImplementation((target: unknown, parameters: AnimationParameters) => {
      if (target instanceof HTMLElement) {
        target.style.opacity = "0";
        target.style.scale = "0.98";
        target.style.translate = "0px 12px";
      }

      return parameters;
    });
    const view = renderDialog({ defaultOpen: true });
    const dialog = await view.findByRole("dialog");
    const overlay = document.querySelector<HTMLElement>("[data-easecraft-dialog-overlay]");

    if (!overlay) {
      throw new Error("Expected the dialog overlay");
    }

    expect(dialog.style.opacity).toBe("0");
    completeContentAnimation(0);

    expect(dialog.getAttribute("data-easecraft-state")).toBe("open");
    expect(dialog.style.opacity).toBe("");
    expect(dialog.style.scale).toBe("");
    expect(dialog.style.translate).toBe("");
    expect(overlay.style.opacity).toBe("");
  });

  it("stays open when a controlled parent accepts the trigger request", async () => {
    const onOpenChange = vi.fn();
    const view = render(<ControlledDialogHarness onOpenChange={onOpenChange} />);
    const trigger = view.getByRole("button", { name: "Open dialog" });

    fireEvent.click(trigger);

    const dialog = await view.findByRole("dialog");
    await act(async () => {
      await Promise.resolve();
    });

    expect(dialog.getAttribute("data-easecraft-state")).toBe("entering");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(onOpenChange.mock.calls).toEqual([[true]]);
  });

  it("renders linked modal semantics and focuses meaningful content", async () => {
    const onAfterOpen = vi.fn();
    const view = renderDialog({ onAfterOpen });
    const trigger = view.getByRole("button", { name: "Open dialog" });

    fireEvent.click(trigger);

    const dialog = await view.findByRole("dialog", { name: "Publish release" });
    const confirm = view.getByRole("button", { name: "Confirm publish" });
    const description = view.getByText("Review the pending release.");

    await waitFor(() => {
      expect(document.activeElement).toBe(confirm);
    });
    expect(dialog.getAttribute("aria-describedby")).toBe(description.id);
    expect(dialog.getAttribute("data-easecraft-state")).toBe("entering");
    expect(document.body.style.pointerEvents).toBe("none");
    expect(animateMock).toHaveBeenCalledTimes(2);

    completeContentAnimation(0);

    expect(dialog.getAttribute("data-easecraft-state")).toBe("open");
    expect(onAfterOpen).toHaveBeenCalledOnce();
  });

  it("retains content through close, then restores trigger focus", async () => {
    const onAfterClose = vi.fn();
    const view = renderDialog({ onAfterClose });
    const trigger = view.getByRole("button", { name: "Open dialog" });

    fireEvent.click(trigger);
    await view.findByRole("dialog");
    completeContentAnimation(0);
    fireEvent.click(view.getByRole("button", { name: "Close" }));

    const exitingDialog = view.getByRole("dialog");
    expect(exitingDialog.getAttribute("data-easecraft-state")).toBe("exiting");

    completeContentAnimation(1);

    await waitFor(() => {
      expect(view.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
    expect(onAfterClose).toHaveBeenCalledOnce();
    expect(document.body.style.pointerEvents).toBe("");
  });

  it("ignores stale entry completion when close interrupts opening", async () => {
    const view = renderDialog();

    fireEvent.click(view.getByRole("button", { name: "Open dialog" }));
    const dialog = await view.findByRole("dialog");
    const staleEnterComplete = getContentAnimations()[0]?.onComplete;

    fireEvent.click(view.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(dialog.getAttribute("data-easecraft-state")).toBe("exiting");
    });

    act(() => {
      staleEnterComplete?.();
    });

    expect(dialog.getAttribute("data-easecraft-state")).toBe("exiting");
    completeContentAnimation(1);
    await waitFor(() => {
      expect(view.queryByRole("dialog")).toBeNull();
    });
  });

  it("dismisses when the modal backdrop is pressed", async () => {
    const onOpenChange = vi.fn();
    const view = renderDialog({ onOpenChange });

    fireEvent.click(view.getByRole("button", { name: "Open dialog" }));
    await view.findByRole("dialog");
    completeContentAnimation(0);

    const overlay = document.querySelector<HTMLElement>("[data-easecraft-dialog-overlay]");

    if (!overlay) {
      throw new Error("Expected the dialog overlay");
    }

    fireEvent.pointerDown(overlay, { button: 0, pointerType: "mouse" });
    fireEvent.click(overlay);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(view.getByRole("dialog").getAttribute("data-easecraft-state")).toBe("exiting");
    });
  });

  it("requests close on Escape and honors the dismissible policy", async () => {
    const onOpenChange = vi.fn();
    const view = renderDialog({ onOpenChange });

    fireEvent.click(view.getByRole("button", { name: "Open dialog" }));
    const dialog = await view.findByRole("dialog");
    completeContentAnimation(0);
    fireEvent.keyDown(dialog, { code: "Escape", key: "Escape" });

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(dialog.getAttribute("data-easecraft-state")).toBe("exiting");

    completeContentAnimation(1);
    await waitFor(() => {
      expect(view.queryByRole("dialog")).toBeNull();
    });
    view.unmount();

    const fixedView = renderDialog({ dismissible: false, onOpenChange });
    fireEvent.click(fixedView.getByRole("button", { name: "Open dialog" }));
    const fixedDialog = await fixedView.findByRole("dialog");
    fireEvent.keyDown(fixedDialog, { code: "Escape", key: "Escape" });

    expect(fixedDialog.getAttribute("data-easecraft-state")).toBe("entering");
  });

  it("ignores stale exit completion after rapid controlled re-entry", async () => {
    const view = renderDialog({ open: true });
    const dialog = await view.findByRole("dialog");
    completeContentAnimation(0);

    view.rerender(
      <MotionDialog
        open={false}
        title="Publish release"
        trigger={<button type="button">Open dialog</button>}
      >
        <button type="button">Confirm publish</button>
      </MotionDialog>,
    );
    await waitFor(() => {
      expect(dialog.getAttribute("data-easecraft-state")).toBe("exiting");
    });
    const staleExitComplete = getContentAnimations()[1]?.onComplete;

    view.rerender(
      <MotionDialog
        open
        title="Publish release"
        trigger={<button type="button">Open dialog</button>}
      >
        <button type="button">Confirm publish</button>
      </MotionDialog>,
    );
    await waitFor(() => {
      expect(dialog.getAttribute("data-easecraft-state")).toBe("entering");
    });

    act(() => {
      staleExitComplete?.();
    });

    expect(view.getByRole("dialog")).toBe(dialog);
    expect(dialog.getAttribute("data-easecraft-state")).toBe("entering");
  });

  it("completes immediately without animation under reduced motion", async () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <MotionDialog
          defaultOpen
          title="Publish release"
          trigger={<button type="button">Open dialog</button>}
        >
          <button type="button">Confirm publish</button>
        </MotionDialog>
      </MotionProvider>,
    );

    const dialog = await view.findByRole("dialog");
    await waitFor(() => {
      expect(dialog.getAttribute("data-easecraft-state")).toBe("open");
    });
    expect(animateMock).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(view.queryByRole("dialog")).toBeNull();
    });
    expect(animateMock).not.toHaveBeenCalled();
  });

  it("supports an explicit initial focus target", async () => {
    const initialFocusRef = createRef<HTMLButtonElement>();
    const view = render(
      <MotionDialog
        initialFocusRef={initialFocusRef}
        title="Publish release"
        trigger={<button type="button">Open dialog</button>}
      >
        <button type="button">First action</button>
        <button ref={initialFocusRef} type="button">
          Preferred action
        </button>
      </MotionDialog>,
    );

    fireEvent.click(view.getByRole("button", { name: "Open dialog" }));
    await view.findByRole("dialog");
    await waitFor(() => {
      expect(document.activeElement).toBe(initialFocusRef.current);
    });
  });

  it("traps programmatic focus while the modal is open", async () => {
    const view = renderDialog();
    const trigger = view.getByRole("button", { name: "Open dialog" });

    fireEvent.click(trigger);
    await view.findByRole("dialog");
    const confirm = view.getByRole("button", { name: "Confirm publish" });

    await waitFor(() => {
      expect(document.activeElement).toBe(confirm);
    });

    trigger.focus();

    await waitFor(() => {
      expect(document.activeElement).toBe(confirm);
    });
  });

  it("renders its trigger safely on the server", () => {
    const html = renderToString(
      <MotionDialog title="Publish release" trigger={<button type="button">Open dialog</button>}>
        Dialog body
      </MotionDialog>,
    );

    expect(html).toContain("Open dialog");
    expect(html).not.toContain('role="dialog"');
    expect(animateMock).not.toHaveBeenCalled();
  });
});
