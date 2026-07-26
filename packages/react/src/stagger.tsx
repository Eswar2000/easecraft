import { stagger } from "animejs/utils";
import {
  Children,
  createElement,
  forwardRef,
  isValidElement,
  useCallback,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ForwardedRef,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import type { DistanceTokens, DurationTokens, EasingTokens, StaggerTokens } from "easecraft-tokens";

import { useAnime, type AnimeSetup, type AnimeTargetElement } from "./use-anime.js";

export type StaggerOrder = "forward" | "reverse";
export type StaggerPreset = "fade" | "rise" | "fade-rise";
export type StaggerDuration = keyof DurationTokens | number;
export type StaggerDistance = keyof DistanceTokens | number;
export type StaggerInterval = keyof StaggerTokens | number;
export type StaggerEasing = keyof EasingTokens | (string & Record<never, never>);
export type StaggerTagName = keyof JSX.IntrinsicElements;

interface StaggerOwnProps<TagName extends StaggerTagName> {
  readonly as?: TagName;
  readonly children?: ReactNode;
  readonly delay?: number;
  readonly distance?: StaggerDistance;
  readonly duration?: StaggerDuration;
  readonly easing?: StaggerEasing;
  readonly interval?: StaggerInterval;
  readonly maxDelay?: StaggerDuration;
  readonly onComplete?: () => void;
  readonly order?: StaggerOrder;
  readonly preset?: StaggerPreset;
}

export type StaggerProps<TagName extends StaggerTagName = "div"> = StaggerOwnProps<TagName> &
  Omit<ComponentPropsWithoutRef<TagName>, keyof StaggerOwnProps<TagName>>;

type StaggerComponent = <TagName extends StaggerTagName = "div">(
  props: StaggerProps<TagName> & { readonly ref?: Ref<ComponentRef<TagName>> },
) => ReactElement | null;

function assignRef(ref: ForwardedRef<AnimeTargetElement>, value: AnimeTargetElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function getDirectTargets(root: AnimeTargetElement): AnimeTargetElement[] {
  return Array.from(root.children).filter(
    (child): child is AnimeTargetElement =>
      child instanceof HTMLElement || child instanceof SVGElement,
  );
}

function getChildSignature(children: ReactNode): string {
  return Children.toArray(children)
    .map((child, index) => {
      if (!isValidElement(child)) {
        if (typeof child === "string" || typeof child === "number" || typeof child === "bigint") {
          return `${typeof child}:${child.toString()}`;
        }

        return `${typeof child}:${index.toString()}`;
      }

      const elementType = typeof child.type === "string" ? child.type : "component";
      const childKey = child.key ?? index;

      return `${childKey.toString()}:${elementType}`;
    })
    .join("|");
}

function StaggerImplementation(
  {
    as,
    children,
    delay = 0,
    distance = "medium",
    duration = "normal",
    easing = "enter",
    interval = "normal",
    maxDelay = "slow",
    onComplete,
    order = "forward",
    preset = "fade-rise",
    ...elementProps
  }: StaggerProps<StaggerTagName>,
  forwardedRef: ForwardedRef<AnimeTargetElement>,
) {
  const hostTag = as ?? "div";
  const childSignature = getChildSignature(children);
  const setupAnimation = useCallback<AnimeSetup<AnimeTargetElement>>(
    ({ animate, reducedMotion, root, tokens }) => {
      if (root.localName !== hostTag) {
        return undefined;
      }

      const targets = getDirectTargets(root);

      if (reducedMotion || childSignature.length === 0 || targets.length === 0) {
        onComplete?.();
        return undefined;
      }

      const resolvedDistance = typeof distance === "number" ? distance : tokens.distance[distance];
      const resolvedDuration = typeof duration === "number" ? duration : tokens.duration[duration];
      const resolvedEasing = Object.hasOwn(tokens.easing, easing)
        ? tokens.easing[easing as keyof EasingTokens]
        : easing;
      const resolvedInterval = typeof interval === "number" ? interval : tokens.stagger[interval];
      const resolvedMaxDelay = typeof maxDelay === "number" ? maxDelay : tokens.duration[maxDelay];
      const intervalCount = Math.max(targets.length - 1, 1);
      const effectiveInterval = Math.min(
        Math.max(0, resolvedInterval),
        Math.max(0, resolvedMaxDelay) / intervalCount,
      );
      const opacity = preset !== "rise" ? [0, 1] : undefined;
      const y = preset !== "fade" ? [resolvedDistance, 0] : undefined;

      animate(targets, {
        delay: stagger(effectiveInterval, {
          from: order === "reverse" ? "last" : "first",
          start: delay,
        }),
        duration: resolvedDuration,
        ease: resolvedEasing,
        ...(opacity ? { opacity } : {}),
        ...(onComplete ? { onComplete } : {}),
        ...(y ? { y } : {}),
      });

      return undefined;
    },
    [
      childSignature,
      delay,
      distance,
      duration,
      easing,
      hostTag,
      interval,
      maxDelay,
      onComplete,
      order,
      preset,
    ],
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
  return createElement(hostTag, { ...elementProps, ref: mergedRef }, children);
}

const ForwardedStagger = forwardRef(StaggerImplementation);
ForwardedStagger.displayName = "Stagger";

export const Stagger = ForwardedStagger as StaggerComponent;
