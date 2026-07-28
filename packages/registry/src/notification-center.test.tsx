// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { NotificationCenter } from "../source/compositions/notification-center.package.js";

const notifications = [
  {
    createdAt: "Now",
    description: "The production bundle completed successfully.",
    duration: Infinity,
    id: "build",
    title: "Build complete",
  },
  {
    createdAt: "2m",
    description: "Keyboard review needs attention.",
    duration: Infinity,
    id: "review",
    priority: "assertive" as const,
    title: "Review required",
  },
  {
    createdAt: "1h",
    id: "release",
    read: true,
    title: "Release published",
  },
] as const;

afterEach(() => {
  cleanup();
});

describe("NotificationCenter", () => {
  it("renders persistent history and a semantic unread count", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <NotificationCenter defaultItems={notifications} />
      </MotionProvider>,
    );

    expect(view.getByRole("heading", { name: "Notification center" })).toBeTruthy();
    expect(view.getByLabelText("2 unread notifications").textContent).toBe("02 unread");
    expect(view.getByRole("list", { name: "Notification history" }).children).toHaveLength(3);
    expect(view.getByRole("button", { name: "Mark as unread" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("marks one or all notifications read and clears history", () => {
    const onReadChange = vi.fn();
    const onClear = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <NotificationCenter
          defaultItems={notifications}
          onClear={onClear}
          onReadChange={onReadChange}
        />
      </MotionProvider>,
    );

    const markReadButton = view.getAllByRole("button", { name: "Mark as read" })[0];

    if (!markReadButton) {
      throw new Error("Expected an unread notification control");
    }

    fireEvent.click(markReadButton);
    expect(onReadChange).toHaveBeenCalledWith("build", true);
    expect(view.getByLabelText("1 unread notifications")).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: "Mark all read" }));
    expect(view.getByLabelText("0 unread notifications")).toBeTruthy();

    fireEvent.click(view.getByRole("button", { name: "Clear all" }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(view.getByRole("status").textContent).toBe("No notifications yet.");
  });

  it("reports controlled updates without mutating rendered history", () => {
    const onItemsChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <NotificationCenter items={notifications} onItemsChange={onItemsChange} />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Clear all" }));

    expect(onItemsChange).toHaveBeenCalledWith([]);
    expect(view.getByRole("list", { name: "Notification history" }).children).toHaveLength(3);
  });

  it("marks a transient notification read when it is dismissed", () => {
    const onDismiss = vi.fn();
    const onReadChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <NotificationCenter
          defaultItems={notifications}
          onDismiss={onDismiss}
          onReadChange={onReadChange}
        />
      </MotionProvider>,
    );

    const dismissButton = view.getAllByRole("button", { name: "Dismiss notification" })[0];

    if (!dismissButton) {
      throw new Error("Expected a notification dismiss control");
    }

    fireEvent.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledWith("build", "close");
    expect(onReadChange).toHaveBeenCalledWith("build", true);
  });

  it("runs a toast action and marks its notification read once", () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    const onReadChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <NotificationCenter
          defaultItems={[
            {
              action: {
                altText: "Review notification",
                label: "Review",
                onClick: onAction,
              },
              duration: Infinity,
              id: "action",
              title: "Action required",
            },
          ]}
          onDismiss={onDismiss}
          onReadChange={onReadChange}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Review" }));

    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith("action", "action");
    expect(onReadChange).toHaveBeenCalledTimes(1);
    expect(onReadChange).toHaveBeenCalledWith("action", true);
  });

  it("rejects duplicate notification ids", () => {
    expect(() =>
      render(
        <MotionProvider reducedMotion="always">
          <NotificationCenter defaultItems={[notifications[0], notifications[0]]} />
        </MotionProvider>,
      ),
    ).toThrow("NotificationCenter received a duplicate item id: build");
  });
});
