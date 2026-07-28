// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { CommandPalette } from "../source/compositions/command-palette.package.js";

const commands = [
  {
    id: "settings",
    keywords: ["preferences", "account"],
    label: "Open settings",
    shortcut: "Ctrl+,",
  },
  { disabled: true, id: "archive", label: "Archive workspace" },
  { id: "project", keywords: ["create"], label: "New project", shortcut: "N" },
] as const;

function renderPalette(onSelect = vi.fn()) {
  const view = render(
    <MotionProvider reducedMotion="always">
      <CommandPalette
        items={commands}
        onSelect={onSelect}
        trigger={<button type="button">Open commands</button>}
      />
    </MotionProvider>,
  );

  return { onSelect, view };
}

afterEach(() => {
  cleanup();
});

describe("CommandPalette", () => {
  it("renders linked dialog, combobox, listbox, and option semantics", async () => {
    const { view } = renderPalette();
    const trigger = view.getByRole("button", { name: "Open commands" });
    fireEvent.click(trigger);

    const combobox = await view.findByRole("combobox", { name: "Search commands" });
    const listbox = view.getByRole("listbox", { name: "Available commands" });
    const options = view.getAllByRole("option");

    expect(document.activeElement).toBe(combobox);
    expect(combobox.getAttribute("aria-controls")).toBe(listbox.id);
    expect(combobox.getAttribute("aria-activedescendant")).toBe(options[0]?.id);
    expect(options).toHaveLength(3);
    expect(options[1]?.getAttribute("aria-disabled")).toBe("true");
  });

  it("skips disabled commands, selects with Enter, and restores trigger focus", async () => {
    const { onSelect, view } = renderPalette();
    const trigger = view.getByRole("button", { name: "Open commands" });
    fireEvent.click(trigger);
    const combobox = await view.findByRole("combobox", { name: "Search commands" });

    fireEvent.keyDown(combobox, { key: "ArrowDown" });
    expect(combobox.getAttribute("aria-activedescendant")).toContain("project");
    fireEvent.keyDown(combobox, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith(commands[2]);
    await waitFor(() => {
      expect(view.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("filters by keywords and reports an empty result", async () => {
    const { view } = renderPalette();
    fireEvent.click(view.getByRole("button", { name: "Open commands" }));
    const combobox = await view.findByRole("combobox", { name: "Search commands" });

    fireEvent.change(combobox, { target: { value: "preferences" } });
    expect(view.getAllByRole("option")).toHaveLength(1);
    expect(view.getByRole("option").textContent).toContain("Open settings");

    fireEvent.change(combobox, { target: { value: "missing" } });
    expect(view.queryAllByRole("option")).toHaveLength(0);
    expect(view.getByRole("status").textContent).toBe("No commands found.");
  });

  it("opens from the global Ctrl+K shortcut", async () => {
    const { view } = renderPalette();

    fireEvent.keyDown(document, { ctrlKey: true, key: "k" });

    expect(await view.findByRole("dialog")).toBeTruthy();
  });

  it("rejects duplicate command ids", () => {
    expect(() =>
      render(
        <MotionProvider reducedMotion="always">
          <CommandPalette
            items={[commands[0], commands[0]]}
            onSelect={() => undefined}
            trigger={<button type="button">Open commands</button>}
          />
        </MotionProvider>,
      ),
    ).toThrow("CommandPalette received a duplicate item id: settings");
  });
});
