import {
  createElement,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type CSSProperties,
  type ForwardedRef,
  type JSX,
  type ReactElement,
  type Ref,
} from "react";
import type { DurationTokens, EasingTokens } from "easecraft-tokens";

import { useAnime, type AnimeSetup } from "./use-anime.js";

const visuallyHiddenStyles: CSSProperties = {
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
};

export type NumberTickerAnnouncement = "off" | "polite" | "assertive";
export type NumberTickerDuration = keyof DurationTokens | number;
export type NumberTickerEasing = keyof EasingTokens | (string & Record<never, never>);
export type NumberTickerTagName = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements;

interface NumberTickerOwnProps<TagName extends NumberTickerTagName> {
  readonly announce?: NumberTickerAnnouncement;
  readonly as?: TagName;
  readonly delay?: number;
  readonly duration?: NumberTickerDuration;
  readonly easing?: NumberTickerEasing;
  readonly formatOptions?: Intl.NumberFormatOptions;
  readonly from?: number;
  readonly locale?: Intl.LocalesArgument;
  readonly onComplete?: (value: number) => void;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly value: number;
}

export type NumberTickerProps<TagName extends NumberTickerTagName = "span"> =
  NumberTickerOwnProps<TagName> &
    Omit<ComponentPropsWithoutRef<TagName>, keyof NumberTickerOwnProps<TagName> | "children">;

type NumberTickerComponent = <TagName extends NumberTickerTagName = "span">(
  props: NumberTickerProps<TagName> & { readonly ref?: Ref<ComponentRef<TagName>> },
) => ReactElement | null;

function assignRef(ref: ForwardedRef<HTMLElement>, value: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function NumberTickerImplementation(
  {
    announce = "off",
    as,
    delay = 0,
    duration = "normal",
    easing = "move",
    formatOptions,
    from = 0,
    locale,
    onComplete,
    prefix = "",
    suffix = "",
    value,
    ...elementProps
  }: NumberTickerProps<NumberTickerTagName>,
  forwardedRef: ForwardedRef<HTMLElement>,
) {
  const hostTag = as ?? "span";
  const formatter = useMemo(
    () => new Intl.NumberFormat(locale, formatOptions),
    [formatOptions, locale],
  );
  const formatValue = useCallback(
    (currentValue: number) => `${prefix}${formatter.format(currentValue)}${suffix}`,
    [formatter, prefix, suffix],
  );
  const currentValueRef = useRef(from);
  const hasAnimatedRef = useRef(false);
  const setupAnimation = useCallback<AnimeSetup<HTMLElement>>(
    ({ animate, reducedMotion, root, tokens }) => {
      if (root.localName !== hostTag) {
        return undefined;
      }

      const visualValue = root.querySelector<HTMLElement>("[data-easecraft-number-value]");

      if (!visualValue) {
        return undefined;
      }

      const writeValue = (nextValue: number) => {
        currentValueRef.current = nextValue;
        visualValue.textContent = formatValue(nextValue);
      };
      const startValue = hasAnimatedRef.current ? currentValueRef.current : from;
      hasAnimatedRef.current = true;

      if (
        reducedMotion ||
        startValue === value ||
        !Number.isFinite(startValue) ||
        !Number.isFinite(value)
      ) {
        writeValue(value);
        onComplete?.(value);
        return undefined;
      }

      const counter = { value: startValue };
      const resolvedDuration = typeof duration === "number" ? duration : tokens.duration[duration];
      const resolvedEasing = Object.hasOwn(tokens.easing, easing)
        ? tokens.easing[easing as keyof EasingTokens]
        : easing;

      writeValue(startValue);
      animate(counter, {
        delay,
        duration: resolvedDuration,
        ease: resolvedEasing,
        onComplete: () => {
          writeValue(value);
          onComplete?.(value);
        },
        onUpdate: () => {
          writeValue(counter.value);
        },
        value,
      });

      return undefined;
    },
    [delay, duration, easing, formatValue, from, hostTag, onComplete, value],
  );
  const rootRef = useAnime(setupAnimation);
  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      rootRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef, rootRef],
  );
  const formattedTarget = formatValue(value);

  const hostProps = { ...elementProps, ref: mergedRef };

  return createElement(
    hostTag,
    // `hostTag` is restricted to intrinsic HTML elements, never function components.
    // eslint-disable-next-line react-hooks/refs
    hostProps,
    createElement(
      "span",
      { "aria-hidden": "true", "data-easecraft-number-value": "" },
      formattedTarget,
    ),
    createElement(
      "span",
      {
        "aria-atomic": announce === "off" ? undefined : "true",
        "aria-live": announce === "off" ? undefined : announce,
        "data-easecraft-number-accessible": "",
        style: visuallyHiddenStyles,
      },
      formattedTarget,
    ),
  );
}

const ForwardedNumberTicker = forwardRef(NumberTickerImplementation);
ForwardedNumberTicker.displayName = "NumberTicker";

export const NumberTicker = ForwardedNumberTicker as NumberTickerComponent;
