import { splitText, type TextSplitter } from "animejs/text";
import { stagger } from "animejs/utils";
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
import type { DistanceTokens, DurationTokens, EasingTokens, StaggerTokens } from "easecraft-tokens";

import { useAnime, type AnimeSetup } from "./use-anime.js";

export type TextRevealSplit = "lines" | "words" | "characters";
export type TextRevealPreset = "fade" | "rise" | "fade-rise";
export type TextRevealDuration = keyof DurationTokens | number;
export type TextRevealDistance = keyof DistanceTokens | number;
export type TextRevealStagger = keyof StaggerTokens | number;
export type TextRevealEasing = keyof EasingTokens | (string & Record<never, never>);
export type TextRevealTagName = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements;

interface TextRevealOwnProps<TagName extends TextRevealTagName> {
  readonly as?: TagName;
  readonly children: string;
  readonly delay?: number;
  readonly distance?: TextRevealDistance;
  readonly duration?: TextRevealDuration;
  readonly easing?: TextRevealEasing;
  readonly onComplete?: () => void;
  readonly preset?: TextRevealPreset;
  readonly split?: TextRevealSplit;
  readonly stagger?: TextRevealStagger;
}

export type TextRevealProps<TagName extends TextRevealTagName = "span"> =
  TextRevealOwnProps<TagName> &
    Omit<ComponentPropsWithoutRef<TagName>, keyof TextRevealOwnProps<TagName>>;

type TextRevealComponent = <TagName extends TextRevealTagName = "span">(
  props: TextRevealProps<TagName> & { readonly ref?: Ref<ComponentRef<TagName>> },
) => ReactElement | null;

function assignRef(ref: ForwardedRef<HTMLElement>, value: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function createSplit(root: HTMLElement, split: TextRevealSplit): TextSplitter {
  return splitText(root, {
    accessible: true,
    chars: split === "characters" ? { wrap: "clip" } : false,
    lines: split === "lines" ? { wrap: "clip" } : false,
    words: split === "words" ? { wrap: "clip" } : false,
  });
}

function getSegments(splitter: TextSplitter, split: TextRevealSplit): HTMLElement[] {
  const segments =
    split === "lines" ? splitter.lines : split === "words" ? splitter.words : splitter.chars;

  return segments as HTMLElement[];
}

function TextRevealImplementation(
  {
    as,
    children,
    delay = 0,
    distance = "medium",
    duration = "normal",
    easing = "enter",
    onComplete,
    preset = "fade-rise",
    split = "words",
    stagger: staggerAmount = "normal",
    ...elementProps
  }: TextRevealProps<TextRevealTagName>,
  forwardedRef: ForwardedRef<HTMLElement>,
) {
  const hostTag = as ?? "span";
  const setupAnimation = useCallback<AnimeSetup<HTMLElement>>(
    ({ animate, reducedMotion, root, tokens }) => {
      if (root.localName !== hostTag) {
        return undefined;
      }

      root.textContent = children;

      if (reducedMotion) {
        animate(root, {
          duration: tokens.duration.instant,
          ease: "linear",
          opacity: [0, 1],
          ...(onComplete ? { onComplete } : {}),
        });

        return undefined;
      }

      const splitter = createSplit(root, split);
      const resolvedDistance = typeof distance === "number" ? distance : tokens.distance[distance];
      const resolvedDuration = typeof duration === "number" ? duration : tokens.duration[duration];
      const resolvedEasing = Object.hasOwn(tokens.easing, easing)
        ? tokens.easing[easing as keyof EasingTokens]
        : easing;
      const resolvedStagger =
        typeof staggerAmount === "number" ? staggerAmount : tokens.stagger[staggerAmount];

      splitter.addEffect((currentSplitter: TextSplitter) => {
        const segments = getSegments(currentSplitter, split);
        const opacity = preset !== "rise" ? [0, 1] : undefined;
        const y = preset !== "fade" ? [resolvedDistance, 0] : undefined;

        return animate(segments, {
          delay: stagger(resolvedStagger, { start: delay }),
          duration: resolvedDuration,
          ease: resolvedEasing,
          ...(opacity ? { opacity } : {}),
          ...(onComplete ? { onComplete } : {}),
          ...(y ? { y } : {}),
        });
      });

      return () => {
        // Scope.revert() restores the DOM before this cleanup runs. Clearing the cached
        // source makes any already-queued font or resize refresh a no-op.
        splitter.html = "";
      };
    },
    [
      children,
      delay,
      distance,
      duration,
      easing,
      hostTag,
      onComplete,
      preset,
      split,
      staggerAmount,
    ],
  );
  const rootRef = useAnime(setupAnimation);
  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      rootRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef, rootRef],
  );

  // `hostTag` is restricted to intrinsic HTML elements, never function components.
  // eslint-disable-next-line react-hooks/refs
  return createElement(hostTag, { ...elementProps, ref: mergedRef }, children);
}

const ForwardedTextReveal = forwardRef(TextRevealImplementation);
ForwardedTextReveal.displayName = "TextReveal";

export const TextReveal = ForwardedTextReveal as TextRevealComponent;
