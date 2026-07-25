import {
  createElement,
  forwardRef,
  useCallback,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ForwardedRef,
  type JSX,
  type ReactElement,
  type Ref,
} from "react";
import type { DistanceTokens, DurationTokens, EasingTokens } from "easecraft-tokens";

import { useAnime, type AnimeSetup, type AnimeTargetElement } from "./use-anime.js";

export type MotionPreset = "fade" | "rise" | "fade-rise";
export type MotionDuration = keyof DurationTokens | number;
export type MotionDistance = keyof DistanceTokens | number;
export type MotionEasing = keyof EasingTokens | (string & Record<never, never>);
export type MotionTagName = keyof JSX.IntrinsicElements;

interface MotionOwnProps<TagName extends MotionTagName> {
  readonly as?: TagName;
  readonly delay?: number;
  readonly distance?: MotionDistance;
  readonly duration?: MotionDuration;
  readonly easing?: MotionEasing;
  readonly preset?: MotionPreset;
}

export type MotionProps<TagName extends MotionTagName = "div"> = MotionOwnProps<TagName> &
  Omit<ComponentPropsWithoutRef<TagName>, keyof MotionOwnProps<TagName>>;

type MotionComponent = <TagName extends MotionTagName = "div">(
  props: MotionProps<TagName> & { readonly ref?: Ref<ComponentRef<TagName>> },
) => ReactElement | null;

function assignRef(ref: ForwardedRef<AnimeTargetElement>, value: AnimeTargetElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function MotionImplementation(
  {
    as,
    delay = 0,
    distance = "medium",
    duration = "normal",
    easing = "enter",
    preset = "fade-rise",
    ...elementProps
  }: MotionProps<MotionTagName>,
  forwardedRef: ForwardedRef<AnimeTargetElement>,
) {
  const hostTag = as ?? "div";
  const setupAnimation = useCallback<AnimeSetup<AnimeTargetElement>>(
    ({ animate, reducedMotion, root, tokens }) => {
      if (root.localName !== hostTag) {
        return undefined;
      }

      const resolvedDistance = typeof distance === "number" ? distance : tokens.distance[distance];
      const resolvedDuration = typeof duration === "number" ? duration : tokens.duration[duration];
      const resolvedEasing = Object.hasOwn(tokens.easing, easing)
        ? tokens.easing[easing as keyof EasingTokens]
        : easing;
      const opacity = reducedMotion || preset !== "rise" ? [0, 1] : undefined;
      const y = !reducedMotion && preset !== "fade" ? [resolvedDistance, 0] : undefined;

      animate(root, {
        delay,
        duration: resolvedDuration,
        ease: resolvedEasing,
        ...(opacity ? { opacity } : {}),
        ...(y ? { y } : {}),
      });

      return undefined;
    },
    [delay, distance, duration, easing, hostTag, preset],
  );
  const rootRef = useAnime(setupAnimation);
  const mergedRef = useCallback(
    (element: AnimeTargetElement | null) => {
      rootRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef, rootRef],
  );
  // `hostTag` is restricted to intrinsic DOM elements, never function components.
  // eslint-disable-next-line react-hooks/refs
  return createElement(hostTag, { ...elementProps, ref: mergedRef });
}

const ForwardedMotion = forwardRef(MotionImplementation);
ForwardedMotion.displayName = "Motion";

export const Motion = ForwardedMotion as MotionComponent;
