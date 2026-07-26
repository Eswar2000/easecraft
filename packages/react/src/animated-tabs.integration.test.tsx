import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AnimatedTabs } from "./animated-tabs.js";

const tabs = [
  { label: "Overview", panel: "Overview panel", value: "overview" },
  { label: "Activity", panel: "Activity panel", value: "activity" },
] as const;

afterEach(() => {
  cleanup();
});

describe("AnimatedTabs integration", () => {
  it("restores in-flight panel styles when its Anime.js scope reverts", () => {
    const view = render(
      <AnimatedTabs
        duration={10_000}
        getLabel={(tab) => tab.label}
        getValue={(tab) => tab.value}
        items={tabs}
      >
        {(tab) => tab.panel}
      </AnimatedTabs>,
    );
    const panel = view.getByRole("tabpanel");

    fireEvent.click(view.getByRole("tab", { name: "Activity" }));

    expect(panel.style.opacity).not.toBe("");

    view.unmount();

    expect(panel.style.opacity).toBe("");
    expect(panel.style.transform).toBe("");
  });
});
