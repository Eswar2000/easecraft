import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnimatedAccordion } from "./animated-accordion.js";

interface AccordionItem {
  readonly label: string;
  readonly panel: string;
  readonly value: string;
}

const items = [{ label: "Details", panel: "Panel content", value: "details" }] as const;

function renderAccordion(duration: number) {
  return render(
    <AnimatedAccordion
      contentStyle={{ opacity: 0.8, overflow: "visible" }}
      duration={duration}
      getLabel={(item: AccordionItem) => item.label}
      getValue={(item: AccordionItem) => item.value}
      items={items}
    >
      {(item) => item.panel}
    </AnimatedAccordion>,
  );
}

function getContent(view: ReturnType<typeof render>) {
  const trigger = view.getByRole("button", { name: "Details" });
  const contentId = trigger.getAttribute("aria-controls");

  if (!contentId) {
    throw new Error("Expected a controlled accordion region");
  }

  const content = document.getElementById(contentId);
  const body = content?.querySelector<HTMLElement>("[data-easecraft-accordion-body]");

  if (!content || !body) {
    throw new Error("Expected retained accordion content");
  }

  Object.defineProperty(body, "scrollHeight", { configurable: true, value: 120 });

  return { content, trigger };
}

afterEach(() => {
  cleanup();
});

describe("AnimatedAccordion integration", () => {
  it("restores authored styles after a completed reveal", async () => {
    const view = renderAccordion(0);
    const { content, trigger } = getContent(view);

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(content.dataset["easecraftState"]).toBe("open");
    });
    expect(content.style.height).toBe("");
    expect(content.style.opacity).toBe("0.8");
    expect(content.style.overflow).toBe("visible");
  });

  it("restores authored styles when an in-flight reveal unmounts", async () => {
    const view = renderAccordion(10_000);
    const { content, trigger } = getContent(view);

    fireEvent.click(trigger);

    await waitFor(() => {
      expect(content.style.height).not.toBe("");
    });

    view.unmount();

    await waitFor(() => {
      expect(content.style.height).toBe("");
      expect(content.style.opacity).toBe("0.8");
      expect(content.style.overflow).toBe("visible");
    });
  });
});
