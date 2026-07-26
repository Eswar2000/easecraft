import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MotionDialog } from "./motion-dialog.js";

afterEach(() => {
  cleanup();
});

describe("MotionDialog integration", () => {
  it("restores authored visible styles after entry completes", async () => {
    const view = render(
      <MotionDialog
        defaultOpen
        duration={50}
        title="Publish release"
        trigger={<button type="button">Open dialog</button>}
      >
        <button type="button">Confirm publish</button>
      </MotionDialog>,
    );
    const dialog = await view.findByRole("dialog");
    const overlay = document.querySelector<HTMLElement>("[data-easecraft-dialog-overlay]");

    if (!overlay) {
      throw new Error("Expected the dialog overlay");
    }

    await waitFor(() => {
      expect(dialog.getAttribute("data-easecraft-state")).toBe("open");
    });

    expect(dialog.style.opacity).toBe("");
    expect(dialog.style.transform).toBe("");
    expect(overlay.style.opacity).toBe("");
    expect(overlay.style.transform).toBe("");
  });

  it("restores in-flight portal styles when its Anime.js scope reverts", async () => {
    const view = render(
      <MotionDialog
        defaultOpen
        duration={10_000}
        title="Publish release"
        trigger={<button type="button">Open dialog</button>}
      >
        <button type="button">Confirm publish</button>
      </MotionDialog>,
    );
    const dialog = await view.findByRole("dialog");
    const overlay = document.querySelector<HTMLElement>("[data-easecraft-dialog-overlay]");

    if (!overlay) {
      throw new Error("Expected the dialog overlay");
    }

    await waitFor(() => {
      expect(dialog.style.opacity).not.toBe("");
      expect(overlay.style.opacity).not.toBe("");
    });

    view.unmount();

    await waitFor(() => {
      expect(dialog.style.opacity).toBe("");
      expect(dialog.style.transform).toBe("");
      expect(overlay.style.opacity).toBe("");
      expect(overlay.style.transform).toBe("");
    });
  });
});
