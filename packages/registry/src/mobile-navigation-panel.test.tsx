// @vitest-environment jsdom

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";
import type { MouseEvent as ReactMouseEvent } from "react";

import {
  MobileNavigationPanel,
  type MobileNavigationItem,
  type MobileNavigationPanelProps,
} from "../source/compositions/mobile-navigation-panel.package.js";

const sections = [
  {
    id: "primary",
    items: [
      {
        current: true,
        description: "Workspace overview",
        href: "/home",
        id: "home",
        label: "Home",
      },
      { badge: "4", href: "/projects", id: "projects", label: "Projects" },
      { disabled: true, href: "/reports", id: "reports", label: "Reports" },
    ],
    label: "Workspace",
  },
  {
    id: "account",
    items: [{ href: "/settings", id: "settings", label: "Settings" }],
    label: "Account",
  },
] as const;

afterEach(() => {
  cleanup();
});

function renderPanel(
  props: Partial<
    Pick<
      MobileNavigationPanelProps,
      "closeOnNavigate" | "defaultOpen" | "onNavigate" | "onOpenChange" | "open"
    >
  > = {},
) {
  return render(
    <MotionProvider reducedMotion="always">
      <MobileNavigationPanel
        brand={<strong>Easecraft</strong>}
        footer={<a href="/help">Help center</a>}
        sections={sections}
        trigger={<button type="button">Open navigation</button>}
        {...props}
      />
    </MotionProvider>,
  );
}

describe("MobileNavigationPanel", () => {
  it("opens a labelled modal navigation panel and focuses the first enabled destination", async () => {
    const view = renderPanel();

    fireEvent.click(view.getByRole("button", { name: "Open navigation" }));

    const dialog = await view.findByRole("dialog", { name: "Navigation" });
    const navigation = view.getByRole("navigation", { name: "Primary navigation" });
    const home = view.getByRole("link", { name: /Home/ });

    await waitFor(() => {
      expect(document.activeElement).toBe(home);
    });
    expect(dialog).toBeTruthy();
    expect(navigation).toBeTruthy();
    expect(view.getAllByRole("list")).toHaveLength(2);
    expect(home.getAttribute("aria-current")).toBe("page");
    expect(view.getByText("Workspace overview")).toBeTruthy();
    expect(view.getByText("Easecraft")).toBeTruthy();
    expect(view.getByRole("link", { name: "Help center" })).toBeTruthy();

    const reports = view
      .getByText("Reports")
      .closest<HTMLElement>("[data-easecraft-mobile-navigation-item]");
    expect(reports?.getAttribute("aria-disabled")).toBe("true");
    expect(reports?.hasAttribute("href")).toBe(false);
    expect(reports?.tabIndex).toBe(-1);
  });

  it("reports an enabled destination, closes the panel, and restores trigger focus", async () => {
    const onNavigate = vi.fn(
      (_: MobileNavigationItem, event: ReactMouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
      },
    );
    const onOpenChange = vi.fn();
    const view = renderPanel({ onNavigate, onOpenChange });
    const trigger = view.getByRole("button", { name: "Open navigation" });

    fireEvent.click(trigger);
    const projects = await view.findByRole("link", { name: /Projects/ });
    fireEvent.click(projects);

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onNavigate.mock.calls[0]?.[0]).toMatchObject({ id: "projects" });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => {
      expect(view.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("can keep the panel open after navigation", async () => {
    const onNavigate = vi.fn(
      (_: MobileNavigationItem, event: ReactMouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
      },
    );
    const view = renderPanel({ closeOnNavigate: false, defaultOpen: true, onNavigate });

    fireEvent.click(await view.findByRole("link", { name: /Settings/ }));

    expect(onNavigate).toHaveBeenCalledOnce();
    expect(view.getByRole("dialog")).toBeTruthy();
  });

  it("reports controlled close requests without changing the rendered state", async () => {
    const onOpenChange = vi.fn();
    const onNavigate = vi.fn(
      (_: MobileNavigationItem, event: ReactMouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
      },
    );
    const view = renderPanel({ onNavigate, onOpenChange, open: true });
    const projects = await view.findByRole("link", { name: /Projects/ });

    fireEvent.click(projects);

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(view.getByRole("dialog")).toBeTruthy();
    expect(
      view.container.querySelector("button[aria-expanded]")?.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("ignores disabled destinations", async () => {
    const onNavigate = vi.fn();
    const onOpenChange = vi.fn();
    const view = renderPanel({ defaultOpen: true, onNavigate, onOpenChange });
    const reports = (await view.findByText("Reports")).closest<HTMLElement>(
      "[data-easecraft-mobile-navigation-item]",
    );

    if (!reports) {
      throw new Error("Expected the disabled Reports destination");
    }

    fireEvent.click(reports);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(view.getByRole("dialog")).toBeTruthy();
  });

  it("rejects invalid section and item metadata", () => {
    const trigger = <button type="button">Open</button>;

    expect(() => render(<MobileNavigationPanel sections={[]} trigger={trigger} />)).toThrow(
      "MobileNavigationPanel requires at least one section.",
    );
    expect(() =>
      render(<MobileNavigationPanel sections={[sections[0], sections[0]]} trigger={trigger} />),
    ).toThrow("MobileNavigationPanel received a duplicate section id: primary");
    expect(() =>
      render(
        <MobileNavigationPanel
          sections={[{ id: "empty", items: [], label: "Empty" }]}
          trigger={trigger}
        />,
      ),
    ).toThrow("MobileNavigationPanel section empty requires at least one item.");
    expect(() =>
      render(
        <MobileNavigationPanel
          sections={[
            { id: "one", items: [sections[0].items[0]] },
            { id: "two", items: [sections[0].items[0]] },
          ]}
          trigger={trigger}
        />,
      ),
    ).toThrow("MobileNavigationPanel received a duplicate item id: home");
    expect(() =>
      render(
        <MobileNavigationPanel
          sections={[{ id: "blank", items: [{ href: " ", id: "blank", label: "Blank" }] }]}
          trigger={trigger}
        />,
      ),
    ).toThrow("MobileNavigationPanel item blank requires a non-empty href.");
    expect(() =>
      render(
        <MobileNavigationPanel
          sections={[
            {
              id: "current",
              items: [
                { current: true, href: "/one", id: "one", label: "One" },
                { current: true, href: "/two", id: "two", label: "Two" },
              ],
            },
          ]}
          trigger={trigger}
        />,
      ),
    ).toThrow("MobileNavigationPanel received multiple current items: one, two");
    expect(() =>
      render(
        <MobileNavigationPanel
          sections={[
            {
              id: "disabled",
              items: [{ disabled: true, href: "/one", id: "one", label: "One" }],
            },
          ]}
          trigger={trigger}
        />,
      ),
    ).toThrow("MobileNavigationPanel requires at least one enabled item.");
  });
});
