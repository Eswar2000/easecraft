import { cleanup, render } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultMotionTokens } from "easecraft-tokens";

import { MotionProvider, type ReducedMotionMode } from "./motion-provider.js";
import { useAnime, type AnimeSetup } from "./use-anime.js";

interface AnimatedNodeProps {
  readonly setup: AnimeSetup<HTMLDivElement>;
}

function AnimatedNode({ setup }: AnimatedNodeProps) {
  const rootRef = useAnime(setup);

  return <div data-testid="root" ref={rootRef} />;
}

interface HarnessProps extends AnimatedNodeProps {
  readonly children?: ReactNode;
  readonly reducedMotion?: ReducedMotionMode;
}

function Harness({ children, reducedMotion = "system", setup }: HarnessProps) {
  return (
    <MotionProvider reducedMotion={reducedMotion}>
      <AnimatedNode setup={setup} />
      {children}
    </MotionProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe("useAnime", () => {
  it("creates a root-scoped setup and runs its cleanup on unmount", () => {
    const setupCleanup = vi.fn();
    const setup = vi.fn<AnimeSetup<HTMLDivElement>>(() => setupCleanup);
    const view = render(<Harness setup={setup} />);
    const root = view.getByTestId("root");
    const setupContext = setup.mock.calls[0]?.[0];

    expect(setup).toHaveBeenCalledTimes(1);
    expect(setupContext?.reducedMotion).toBe(false);
    expect(setupContext?.animate).toBeTypeOf("function");
    expect(setupContext?.root).toBe(root);
    expect(setupContext?.scope.root).toBe(root);
    expect(setupContext?.tokens).toEqual(defaultMotionTokens);

    view.unmount();

    expect(setupCleanup).toHaveBeenCalledTimes(1);
  });

  it("reverts inline styles created by scoped Anime.js animations", () => {
    const setup: AnimeSetup<HTMLDivElement> = ({ animate, root }) => {
      animate(root, { duration: 0, opacity: 0.25 });

      return undefined;
    };
    const view = render(<Harness setup={setup} />);
    const root = view.getByTestId("root");

    expect(root.style.opacity).toBe("0.25");

    view.unmount();

    expect(root.style.opacity).toBe("");
  });

  it("reverts the previous scope before running a changed setup", () => {
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const firstSetup = vi.fn<AnimeSetup<HTMLDivElement>>(() => firstCleanup);
    const secondSetup = vi.fn<AnimeSetup<HTMLDivElement>>(() => secondCleanup);
    const view = render(<Harness setup={firstSetup} />);

    view.rerender(<Harness setup={secondSetup} />);

    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(secondSetup).toHaveBeenCalledTimes(1);

    view.unmount();

    expect(secondCleanup).toHaveBeenCalledTimes(1);
  });

  it("recreates the scope when reduced-motion mode changes", () => {
    const cleanupSetup = vi.fn();
    const setup = vi.fn<AnimeSetup<HTMLDivElement>>(() => cleanupSetup);
    const view = render(<Harness reducedMotion="never" setup={setup} />);

    expect(setup.mock.calls[0]?.[0].reducedMotion).toBe(false);

    view.rerender(<Harness reducedMotion="always" setup={setup} />);

    expect(cleanupSetup).toHaveBeenCalledTimes(1);
    expect(setup.mock.calls[1]?.[0].reducedMotion).toBe(true);
  });

  it("pairs every Strict Mode setup with cleanup", () => {
    const setupCleanup = vi.fn();
    const setup = vi.fn<AnimeSetup<HTMLDivElement>>(() => setupCleanup);
    const view = render(
      <StrictMode>
        <Harness setup={setup} />
      </StrictMode>,
    );

    expect(setup).toHaveBeenCalledTimes(2);
    expect(setupCleanup).toHaveBeenCalledTimes(1);

    view.unmount();

    expect(setupCleanup).toHaveBeenCalledTimes(2);
  });

  it("does not create a scope during server rendering", () => {
    const setup = vi.fn<AnimeSetup<HTMLDivElement>>();

    expect(renderToString(<AnimatedNode setup={setup} />)).toContain("<div");
    expect(setup).not.toHaveBeenCalled();
  });
});
