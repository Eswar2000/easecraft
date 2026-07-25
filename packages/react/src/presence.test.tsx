import { StrictMode, useEffect } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MotionProvider } from "./motion-provider.js";
import { Presence, type PresenceRenderProps } from "./presence.js";

const observedTransitions: PresenceRenderProps[] = [];

function PresenceProbe(props: PresenceRenderProps) {
  useEffect(() => {
    observedTransitions.push(props);
  }, [props]);

  return <div data-state={props.state} data-testid="content" />;
}

function getLatestTransition(): PresenceRenderProps {
  const transition = observedTransitions.at(-1);

  if (!transition) {
    throw new Error("No presence transition was observed");
  }

  return transition;
}

afterEach(() => {
  cleanup();
  observedTransitions.length = 0;
});

describe("Presence", () => {
  it("does not render children when initially hidden", () => {
    const renderChild = vi.fn((props: PresenceRenderProps) => <PresenceProbe {...props} />);
    const view = render(<Presence present={false}>{renderChild}</Presence>);

    expect(view.queryByTestId("content")).toBeNull();
    expect(renderChild).not.toHaveBeenCalled();
  });

  it("retains content through exit and invokes completion callbacks once", () => {
    const onEnterComplete = vi.fn();
    const onExitComplete = vi.fn();
    const view = render(
      <Presence onEnterComplete={onEnterComplete} onExitComplete={onExitComplete} present>
        {(props) => <PresenceProbe {...props} />}
      </Presence>,
    );
    const content = view.getByTestId("content");

    expect(content.dataset["state"]).toBe("entering");

    act(() => {
      getLatestTransition().complete();
    });

    expect(content.dataset["state"]).toBe("present");
    expect(onEnterComplete).toHaveBeenCalledTimes(1);

    view.rerender(
      <Presence onEnterComplete={onEnterComplete} onExitComplete={onExitComplete} present={false}>
        {(props) => <PresenceProbe {...props} />}
      </Presence>,
    );

    expect(view.getByTestId("content")).toBe(content);
    expect(content.dataset["state"]).toBe("exiting");

    act(() => {
      getLatestTransition().complete();
    });

    expect(view.queryByTestId("content")).toBeNull();
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });

  it("ignores a stale exit completion after rapid re-entry", () => {
    const onExitComplete = vi.fn();
    const view = render(
      <Presence onExitComplete={onExitComplete} present>
        {(props) => <PresenceProbe {...props} />}
      </Presence>,
    );
    const content = view.getByTestId("content");

    act(() => {
      getLatestTransition().complete();
    });

    expect(content.dataset["state"]).toBe("present");

    view.rerender(
      <Presence onExitComplete={onExitComplete} present={false}>
        {(props) => <PresenceProbe {...props} />}
      </Presence>,
    );

    expect(view.getByTestId("content")).toBe(content);
    expect(content.dataset["state"]).toBe("exiting");

    const staleExitComplete = getLatestTransition().complete;

    view.rerender(
      <Presence onExitComplete={onExitComplete} present>
        {(props) => <PresenceProbe {...props} />}
      </Presence>,
    );

    expect(content.dataset["state"]).toBe("entering");

    act(() => {
      staleExitComplete();
    });

    expect(view.getByTestId("content")).toBe(content);
    expect(content.dataset["state"]).toBe("entering");
    expect(onExitComplete).not.toHaveBeenCalled();
  });

  it("ignores a pending completion after the controller unmounts", () => {
    const onEnterComplete = vi.fn();
    const view = render(
      <Presence onEnterComplete={onEnterComplete} present>
        {(props) => <PresenceProbe {...props} />}
      </Presence>,
    );
    const pendingComplete = getLatestTransition().complete;

    view.unmount();

    act(() => {
      pendingComplete();
    });

    expect(onEnterComplete).not.toHaveBeenCalled();
  });

  it("auto-completes enter and exit when reduced motion is active", () => {
    const onEnterComplete = vi.fn();
    const onExitComplete = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <Presence onEnterComplete={onEnterComplete} onExitComplete={onExitComplete} present>
          {(props) => <PresenceProbe {...props} />}
        </Presence>
      </MotionProvider>,
    );

    expect(view.getByTestId("content").dataset["state"]).toBe("present");
    expect(onEnterComplete).toHaveBeenCalledTimes(1);

    view.rerender(
      <MotionProvider reducedMotion="always">
        <Presence onEnterComplete={onEnterComplete} onExitComplete={onExitComplete} present={false}>
          {(props) => <PresenceProbe {...props} />}
        </Presence>
      </MotionProvider>,
    );

    expect(view.queryByTestId("content")).toBeNull();
    expect(onExitComplete).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate completion callbacks in Strict Mode", () => {
    const onEnterComplete = vi.fn();
    const view = render(
      <StrictMode>
        <Presence onEnterComplete={onEnterComplete} present>
          {(props) => <PresenceProbe {...props} />}
        </Presence>
      </StrictMode>,
    );

    act(() => {
      getLatestTransition().complete();
    });

    expect(onEnterComplete).toHaveBeenCalledTimes(1);
    expect(view.getByTestId("content").dataset["state"]).toBe("present");
  });
});
