import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TextReveal } from "./text-reveal.js";

class ResizeObserverStub {
  disconnect() {
    return undefined;
  }

  observe() {
    return undefined;
  }

  unobserve() {
    return undefined;
  }
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { ready: Promise.resolve(), status: "loaded" },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, "fonts");
});

describe("TextReveal integration", () => {
  it("keeps one accessible name and restores the original HTML on unmount", () => {
    const view = render(
      <TextReveal as="h2" duration={0} stagger={0}>
        Motion with purpose.
      </TextReveal>,
    );
    const heading = view.getByRole("heading", { name: "Motion with purpose." });
    const words = heading.querySelectorAll("[data-word]");

    expect(words).toHaveLength(3);
    expect(Array.from(words).every((word) => word.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );

    view.unmount();

    expect(heading.innerHTML).toBe("Motion with purpose.");
  });

  it("does not duplicate split or accessible output in Strict Mode", () => {
    const view = render(
      <StrictMode>
        <TextReveal as="h2" duration={0} stagger={0}>
          Motion with purpose.
        </TextReveal>
      </StrictMode>,
    );
    const heading = view.getByRole("heading", { name: "Motion with purpose." });

    expect(heading.querySelectorAll("[data-word]")).toHaveLength(3);
    expect(view.getAllByRole("heading", { name: "Motion with purpose." })).toHaveLength(1);
  });
});
