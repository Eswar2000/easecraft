import { animate } from "animejs/animation";
import { createScope, type Scope } from "animejs/scope";
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ForwardedRef,
  type JSX,
  type ReactElement,
  type Ref,
} from "react";
import type { DistanceTokens, DurationTokens, EasingTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";

export type ScrollRevealPreset = "fade" | "rise" | "fade-rise";
export type ScrollRevealState = "visible" | "waiting" | "revealing" | "revealed";
export type ScrollRevealDuration = keyof DurationTokens | number;
export type ScrollRevealDistance = keyof DistanceTokens | number;
export type ScrollRevealEasing = keyof EasingTokens | (string & Record<never, never>);
export type ScrollRevealTagName = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements;
export type ScrollRevealThreshold = number | readonly number[];

interface ScrollRevealOwnProps<TagName extends ScrollRevealTagName> {
  readonly as?: TagName;
  readonly delay?: number;
  readonly distance?: ScrollRevealDistance;
  readonly duration?: ScrollRevealDuration;
  readonly easing?: ScrollRevealEasing;
  readonly observerRoot?: Element | Document | null;
  readonly onReveal?: () => void;
  readonly onVisibilityChange?: (visible: boolean) => void;
  readonly once?: boolean;
  readonly preset?: ScrollRevealPreset;
  readonly rootMargin?: string;
  readonly threshold?: ScrollRevealThreshold;
}

export type ScrollRevealProps<TagName extends ScrollRevealTagName = "div"> =
  ScrollRevealOwnProps<TagName> &
    Omit<ComponentPropsWithoutRef<TagName>, keyof ScrollRevealOwnProps<TagName>>;

type ScrollRevealComponent = <TagName extends ScrollRevealTagName = "div">(
  props: ScrollRevealProps<TagName> & { readonly ref?: Ref<ComponentRef<TagName>> },
) => ReactElement | null;

interface MotionStyleSnapshot {
  readonly opacity: string;
  readonly transform: string;
  readonly visibility: string;
}

function assignRef(ref: ForwardedRef<HTMLElement>, value: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function resolveDuration(duration: ScrollRevealDuration, tokens: DurationTokens): number {
  return typeof duration === "number" ? duration : tokens[duration];
}

function resolveDistance(distance: ScrollRevealDistance, tokens: DistanceTokens): number {
  return typeof distance === "number" ? distance : tokens[distance];
}

function resolveEasing(easing: ScrollRevealEasing, tokens: EasingTokens): string {
  return Object.hasOwn(tokens, easing) ? tokens[easing as keyof EasingTokens] : easing;
}

function normalizeThreshold(threshold: ScrollRevealThreshold): number | number[] {
  if (typeof threshold === "number") {
    return Math.max(0, Math.min(1, threshold));
  }

  return [...new Set(threshold.map((value) => Math.max(0, Math.min(1, value))))].sort(
    (first, second) => first - second,
  );
}

function getMotionStyle(element: HTMLElement): MotionStyleSnapshot {
  return {
    opacity: element.style.opacity,
    transform: element.style.transform,
    visibility: element.style.visibility,
  };
}

function applyMotionStyle(element: HTMLElement, snapshot: MotionStyleSnapshot) {
  element.style.opacity = snapshot.opacity;
  element.style.transform = snapshot.transform;
  element.style.visibility = snapshot.visibility;
}

function ScrollRevealImplementation(
  {
    as,
    delay = 0,
    distance = "medium",
    duration = "normal",
    easing = "enter",
    observerRoot = null,
    onReveal,
    onVisibilityChange,
    once = true,
    preset = "fade-rise",
    rootMargin = "0px 0px -10% 0px",
    threshold = 0.15,
    ...elementProps
  }: ScrollRevealProps<ScrollRevealTagName>,
  forwardedRef: ForwardedRef<HTMLElement>,
) {
  const hostTag = as ?? "div";
  const { reducedMotion, tokens } = useMotionConfig();
  const rootRef = useRef<HTMLElement>(null);
  const onRevealRef = useRef(onReveal);
  const onVisibilityChangeRef = useRef(onVisibilityChange);

  useLayoutEffect(() => {
    onRevealRef.current = onReveal;
    onVisibilityChangeRef.current = onVisibilityChange;
  }, [onReveal, onVisibilityChange]);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const element = root;
    const authoredStyle = getMotionStyle(element);
    let transitionScope: Scope | null = null;
    let transitionId = 0;
    let intersecting = false;
    let revealed = false;

    function restoreVisible(state: Extract<ScrollRevealState, "visible" | "revealed">) {
      transitionScope?.revert();
      transitionScope = null;
      applyMotionStyle(element, authoredStyle);
      element.dataset["easecraftScrollState"] = state;
    }

    if (reducedMotion || typeof IntersectionObserver === "undefined") {
      restoreVisible(reducedMotion ? "revealed" : "visible");
      return undefined;
    }

    function hide() {
      transitionScope?.revert();
      transitionScope = null;
      applyMotionStyle(element, authoredStyle);

      if (preset === "rise") {
        element.style.visibility = "hidden";
      } else {
        element.style.opacity = "0";
      }

      element.dataset["easecraftScrollState"] = "waiting";
    }

    hide();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find((candidate) => candidate.target === element);

        if (!entry) {
          return;
        }

        if (!entry.isIntersecting) {
          if (!once && intersecting) {
            transitionId += 1;
            intersecting = false;
            revealed = false;
            hide();
            onVisibilityChangeRef.current?.(false);
          }

          return;
        }

        if (intersecting || (once && revealed)) {
          return;
        }

        intersecting = true;
        transitionId += 1;
        const currentTransitionId = transitionId;
        transitionScope?.revert();
        applyMotionStyle(element, authoredStyle);
        element.dataset["easecraftScrollState"] = "revealing";
        transitionScope = createScope({ root: element });
        const resolvedDistance = resolveDistance(distance, tokens.distance);
        const resolvedDuration = resolveDuration(duration, tokens.duration);
        const resolvedEasing = resolveEasing(easing, tokens.easing);

        transitionScope.add(() => {
          animate(element, {
            delay,
            duration: resolvedDuration,
            ease: resolvedEasing,
            onComplete: () => {
              if (currentTransitionId !== transitionId) {
                return;
              }

              revealed = true;
              restoreVisible("revealed");
              onVisibilityChangeRef.current?.(true);
              onRevealRef.current?.();

              if (once) {
                observer.disconnect();
              }
            },
            ...(preset === "rise" ? {} : { opacity: [0, 1] }),
            ...(preset === "fade" ? {} : { y: [resolvedDistance, 0] }),
          });
        });
      },
      {
        root: observerRoot,
        rootMargin,
        threshold: normalizeThreshold(threshold),
      },
    );

    observer.observe(element);

    return () => {
      transitionId += 1;
      observer.disconnect();
      transitionScope?.revert();
      applyMotionStyle(element, authoredStyle);
    };
  }, [
    delay,
    distance,
    duration,
    easing,
    observerRoot,
    once,
    preset,
    reducedMotion,
    rootMargin,
    threshold,
    tokens,
  ]);

  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      rootRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef],
  );
  const hostProps = {
    ...elementProps,
    "data-easecraft-scroll-reveal": "",
    "data-easecraft-scroll-state": "visible",
    ref: mergedRef,
  };

  return createElement(
    hostTag,
    // `hostTag` is restricted to intrinsic HTML elements, never function components.
    // eslint-disable-next-line react-hooks/refs
    hostProps,
  );
}

const ForwardedScrollReveal = forwardRef(ScrollRevealImplementation);
ForwardedScrollReveal.displayName = "ScrollReveal";

export const ScrollReveal = ForwardedScrollReveal as ScrollRevealComponent;
