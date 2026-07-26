import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ToastStack } from "./toast-stack.js";

afterEach(() => {
  cleanup();
});

describe("ToastStack integration", () => {
  it("restores in-flight toast styles when its Anime.js scope reverts", async () => {
    const view = render(
      <ToastStack
        entryDuration={10_000}
        items={[{ id: "build", title: "Build complete" }]}
        onDismiss={() => undefined}
      />,
    );
    const title = await view.findByText("Build complete");
    const content = title.closest<HTMLElement>("[data-easecraft-toast-content]");

    if (!content) {
      throw new Error("Expected toast content");
    }

    await waitFor(() => {
      expect(content.style.opacity).not.toBe("");
    });

    view.unmount();

    await waitFor(() => {
      expect(content.style.opacity).toBe("");
      expect(content.style.transform).toBe("");
    });
  });
});
