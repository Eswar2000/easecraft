// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { version as reactVersion } from "../../../../packages/react/package.json";
import { getComponentDeliverySources } from "./delivery-source";
import { serializeRegistrySources } from "./delivery-types";
import { RegistryDeliveryPanel } from "./registry-delivery-panel";

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

describe("RegistryDeliveryPanel component delivery", () => {
  it("renders package installation with an intentional zero-file plan", () => {
    const sources = getComponentDeliverySources("text-reveal");
    const view = render(
      createElement(RegistryDeliveryPanel, {
        kind: "component",
        slug: "text-reveal",
        sources,
      }),
    );

    expect(view.getByLabelText("Install command").textContent).toBe(
      `pnpm add easecraft@${reactVersion}`,
    );
    expect(view.getByRole("heading", { name: "Files / 00" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Copy all" }).hasAttribute("disabled")).toBe(true);
    expect(view.getByText("The component imports stable APIs from easecraft.")).toBeTruthy();
  });

  it("copies component commands, individual files, and the transitive graph", async () => {
    const sources = getComponentDeliverySources("filter-grid");
    const view = render(
      createElement(RegistryDeliveryPanel, {
        kind: "component",
        slug: "filter-grid",
        sources,
      }),
    );

    fireEvent.click(view.getByRole("button", { name: "Copy install command" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(`pnpm add easecraft@${reactVersion}`);
    });

    fireEvent.click(view.getByRole("button", { name: "Copy source" }));
    expect(view.getByRole("heading", { name: "Files / 05" })).toBeTruthy();

    const componentFile = sources["copy-source"].at(-1);

    if (!componentFile) {
      throw new Error("Expected the Filter Grid component source");
    }

    fireEvent.click(view.getByRole("button", { name: `Copy ${componentFile.destinationPath}` }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(componentFile.content);
    });

    fireEvent.click(view.getByRole("button", { name: "Copy all" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenLastCalledWith(serializeRegistrySources(sources["copy-source"]));
      expect(view.getByRole("status").textContent).toBe("5 files copied.");
    });
  });
});
