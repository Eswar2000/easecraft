// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { version as reactVersion } from "../../../../../packages/react/package.json";
import { CompositionDeliveryPanel } from "./composition-delivery-panel";
import {
  serializeCompositionSources,
  type CompositionDeliverySources,
} from "./composition-delivery-types";

const writeText = vi.fn<(value: string) => Promise<void>>();
const sources = {
  package: [
    {
      content: "export const packageCore = true;\n",
      destinationPath: "components/easecraft/compositions/command-palette-core.tsx",
      role: "utility",
    },
    {
      content: "export const packageEntry = true;\n",
      destinationPath: "components/easecraft/compositions/command-palette.tsx",
      role: "composition",
    },
  ],
  "copy-source": [
    {
      content: "export const provider = true;\n",
      destinationPath: "components/easecraft/motion-provider.tsx",
      role: "provider",
    },
    {
      content: "export const dialog = true;\n",
      destinationPath: "components/easecraft/motion-dialog.tsx",
      role: "component",
    },
    {
      content: "export const copyCore = true;\n",
      destinationPath: "components/easecraft/compositions/command-palette-core.tsx",
      role: "utility",
    },
    {
      content: "export const copyEntry = true;\n",
      destinationPath: "components/easecraft/compositions/command-palette.tsx",
      role: "composition",
    },
  ],
} as const satisfies CompositionDeliverySources;

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

describe("CompositionDeliveryPanel copy actions", () => {
  it("copies the selected package-manager command and reports success", async () => {
    const view = render(
      createElement(CompositionDeliveryPanel, { slug: "command-palette", sources }),
    );

    fireEvent.click(view.getByRole("button", { name: "npm" }));
    fireEvent.click(view.getByRole("button", { name: "Copy install command" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`npm install easecraft@${reactVersion}`);
      expect(view.getByRole("status").textContent).toBe("Install command copied.");
    });
  });

  it("copies one source file from the active delivery mode", async () => {
    const view = render(
      createElement(CompositionDeliveryPanel, { slug: "command-palette", sources }),
    );
    const entry = sources.package.at(-1);

    if (!entry) {
      throw new Error("Expected the package-backed Command Palette entry");
    }

    fireEvent.click(view.getByRole("button", { name: `Copy ${entry.destinationPath}` }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(entry.content);
      expect(view.getByRole("status").textContent).toBe(`${entry.destinationPath} copied.`);
    });
  });

  it("copies all copy-source files with deterministic path headers", async () => {
    const view = render(
      createElement(CompositionDeliveryPanel, { slug: "command-palette", sources }),
    );

    fireEvent.click(view.getByRole("button", { name: "Copy source" }));
    fireEvent.click(view.getByRole("button", { name: "Copy all" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(serializeCompositionSources(sources["copy-source"]));
      expect(view.getByRole("status").textContent).toBe("4 files copied.");
    });
  });

  it("reports clipboard failures without changing delivery state", async () => {
    writeText.mockRejectedValue(new Error("Permission denied"));
    const view = render(
      createElement(CompositionDeliveryPanel, { slug: "command-palette", sources }),
    );

    fireEvent.click(view.getByRole("button", { name: "Copy install command" }));

    await waitFor(() => {
      expect(view.getByRole("status").textContent).toBe(
        "Copy failed. Select the text and copy it manually.",
      );
    });
    expect(view.getByRole("button", { name: "Package" }).getAttribute("aria-pressed")).toBe("true");
  });
});
