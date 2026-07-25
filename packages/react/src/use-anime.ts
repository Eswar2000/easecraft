import { animate } from "animejs/animation";
import { createScope, type Scope } from "animejs/scope";
import { useEffect, useRef, type RefObject } from "react";
import type { MotionTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";

export type AnimeTargetElement = HTMLElement | SVGElement;

export interface AnimeSetupContext<ElementType extends AnimeTargetElement> {
  readonly animate: typeof animate;
  readonly reducedMotion: boolean;
  readonly root: ElementType;
  readonly scope: Scope;
  readonly tokens: MotionTokens;
}

export type AnimeSetup<ElementType extends AnimeTargetElement> = (
  context: AnimeSetupContext<ElementType>,
) => undefined | (() => void);

export function useAnime<ElementType extends AnimeTargetElement = HTMLDivElement>(
  setup: AnimeSetup<ElementType>,
): RefObject<ElementType | null> {
  const rootRef = useRef<ElementType>(null);
  const { reducedMotion, tokens } = useMotionConfig();

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const scope = createScope({ root });

    scope.add(() => setup({ animate, reducedMotion, root, scope, tokens }));

    return () => {
      scope.revert();
    };
  }, [reducedMotion, setup, tokens]);

  return rootRef;
}
