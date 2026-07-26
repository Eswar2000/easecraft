import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";
import {
  createElement,
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type CSSProperties,
  type ForwardedRef,
  type JSX,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import type { DistanceTokens, DurationTokens, EasingTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";

export type AnimatedTabsActivationMode = "automatic" | "manual";
export type AnimatedTabsOrientation = "horizontal" | "vertical";
export type AnimatedTabsDuration = keyof DurationTokens | number;
export type AnimatedTabsDistance = keyof DistanceTokens | number;
export type AnimatedTabsEasing = keyof EasingTokens | (string & Record<never, never>);
export type AnimatedTabsTagName = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements;

interface AnimatedTabsOwnProps<Item, Value extends string, TagName extends AnimatedTabsTagName> {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly activationMode?: AnimatedTabsActivationMode;
  readonly as?: TagName;
  readonly children: (item: Item) => ReactNode;
  readonly defaultValue?: Value;
  readonly distance?: AnimatedTabsDistance;
  readonly duration?: AnimatedTabsDuration;
  readonly easing?: AnimatedTabsEasing;
  readonly getLabel: (item: Item) => ReactNode;
  readonly getValue: (item: Item) => Value;
  readonly isDisabled?: (item: Item) => boolean;
  readonly items: readonly Item[];
  readonly loop?: boolean;
  readonly onValueChange?: (value: Value) => void;
  readonly orientation?: AnimatedTabsOrientation;
  readonly panelEasing?: AnimatedTabsEasing;
  readonly value?: Value;
}

export type AnimatedTabsProps<
  Item,
  Value extends string = string,
  TagName extends AnimatedTabsTagName = "div",
> = AnimatedTabsOwnProps<Item, Value, TagName> &
  Omit<ComponentPropsWithoutRef<TagName>, keyof AnimatedTabsOwnProps<Item, Value, TagName>>;

type AnimatedTabsComponent = <
  Item,
  Value extends string = string,
  TagName extends AnimatedTabsTagName = "div",
>(
  props: AnimatedTabsProps<Item, Value, TagName> & {
    readonly ref?: Ref<ComponentRef<TagName>>;
  },
) => ReactElement | null;

interface TabRecord<Item> {
  readonly disabled: boolean;
  readonly item: Item;
  readonly value: string;
}

interface IndicatorGeometry {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

const indicatorStyles: CSSProperties = {
  background: "currentColor",
  opacity: 0,
  pointerEvents: "none",
  position: "absolute",
};

function assignRef(ref: ForwardedRef<HTMLElement>, value: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function createRecords<Item>(
  items: readonly Item[],
  getValue: (item: Item) => string,
  isDisabled: ((item: Item) => boolean) | undefined,
): TabRecord<Item>[] {
  const values = new Set<string>();

  return items.map((item) => {
    const value = getValue(item);

    if (values.has(value)) {
      throw new Error(`AnimatedTabs received a duplicate value: ${value}`);
    }

    values.add(value);

    return { disabled: isDisabled?.(item) ?? false, item, value };
  });
}

function getEnabledRecord<Item>(records: readonly TabRecord<Item>[], value: string | undefined) {
  return records.find((record) => !record.disabled && record.value === value);
}

function getIdPart(value: string): string {
  return encodeURIComponent(value).replaceAll("%", "-");
}

function resolveDuration(duration: AnimatedTabsDuration, tokens: DurationTokens): number {
  return typeof duration === "number" ? duration : tokens[duration];
}

function resolveDistance(distance: AnimatedTabsDistance, tokens: DistanceTokens): number {
  return typeof distance === "number" ? distance : tokens[distance];
}

function resolveEasing(easing: AnimatedTabsEasing, tokens: EasingTokens): string {
  return Object.hasOwn(tokens, easing) ? tokens[easing as keyof EasingTokens] : easing;
}

function findTabButton(root: HTMLElement, value: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
    (button) => button.dataset["value"] === value,
  );
}

function getIndicatorGeometry(
  tab: HTMLButtonElement,
  orientation: AnimatedTabsOrientation,
): IndicatorGeometry {
  if (orientation === "vertical") {
    return {
      height: tab.offsetHeight,
      width: 2,
      x: tab.offsetLeft,
      y: tab.offsetTop,
    };
  }

  return {
    height: 2,
    width: tab.offsetWidth,
    x: tab.offsetLeft,
    y: tab.offsetTop + tab.offsetHeight - 2,
  };
}

function applyIndicatorGeometry(indicator: HTMLElement, geometry: IndicatorGeometry) {
  indicator.style.width = `${geometry.width.toString()}px`;
  indicator.style.height = `${geometry.height.toString()}px`;
  indicator.style.opacity = "1";
  indicator.style.transform = `translate(${geometry.x.toString()}px, ${geometry.y.toString()}px)`;
}

function AnimatedTabsImplementation(
  {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    activationMode = "automatic",
    as,
    children,
    defaultValue,
    distance = "small",
    duration = "normal",
    easing = "move",
    getLabel,
    getValue,
    isDisabled,
    items,
    loop = true,
    onValueChange,
    orientation = "horizontal",
    panelEasing = "enter",
    value,
    ...elementProps
  }: AnimatedTabsProps<unknown, string, AnimatedTabsTagName>,
  forwardedRef: ForwardedRef<HTMLElement>,
) {
  const hostTag = as ?? "div";
  const generatedId = useId();
  const rootId = elementProps.id ?? `easecraft-tabs-${generatedId}`;
  const records = createRecords(items, getValue, isDisabled);
  const enabledRecords = records.filter((record) => !record.disabled);
  const firstEnabledValue = enabledRecords[0]?.value;
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(
    () => getEnabledRecord(records, defaultValue)?.value ?? firstEnabledValue,
  );
  const requestedValue = value ?? uncontrolledValue;
  const activeRecord = getEnabledRecord(records, requestedValue) ?? enabledRecords[0];
  const activeValue = activeRecord?.value;
  const activeIndex = activeValue
    ? records.findIndex((record) => record.value === activeValue)
    : -1;
  const itemSignature = records.map((record) => record.value).join("\u0000");
  const [focusedValue, setFocusedValue] = useState<string | undefined>(activeValue);
  const rovingValue = getEnabledRecord(records, focusedValue)?.value ?? activeValue;
  const { reducedMotion, tokens } = useMotionConfig();
  const rootRef = useRef<HTMLElement>(null);
  const hasPositionedIndicatorRef = useRef(false);
  const previousActiveValueRef = useRef(activeValue);
  const previousIndexRef = useRef(activeIndex);

  function selectValue(nextValue: string) {
    if (nextValue === activeValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentValue: string) {
    const enabledIndex = enabledRecords.findIndex((record) => record.value === currentValue);

    if (enabledIndex < 0) {
      return;
    }

    let nextIndex: number | undefined;

    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabledRecords.length - 1;
    } else if (
      (orientation === "horizontal" && event.key === "ArrowRight") ||
      (orientation === "vertical" && event.key === "ArrowDown")
    ) {
      nextIndex = enabledIndex + 1;
    } else if (
      (orientation === "horizontal" && event.key === "ArrowLeft") ||
      (orientation === "vertical" && event.key === "ArrowUp")
    ) {
      nextIndex = enabledIndex - 1;
    } else if (activationMode === "manual" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      selectValue(currentValue);
      return;
    } else {
      return;
    }

    event.preventDefault();

    if (loop && enabledRecords.length > 0) {
      nextIndex = (nextIndex + enabledRecords.length) % enabledRecords.length;
    } else {
      nextIndex = Math.max(0, Math.min(nextIndex, enabledRecords.length - 1));
    }

    const nextRecord = enabledRecords[nextIndex];

    if (nextRecord) {
      setFocusedValue(nextRecord.value);
      findTabButton(event.currentTarget.parentElement ?? document.body, nextRecord.value)?.focus();

      if (activationMode === "automatic") {
        selectValue(nextRecord.value);
      }
    }
  }

  useLayoutEffect(() => {
    const root = rootRef.current;
    const indicator = root?.querySelector<HTMLElement>("[data-easecraft-tabs-indicator]");
    const panel = root?.querySelector<HTMLElement>("[data-easecraft-tabs-panel]");
    const activeTab = root && activeValue ? findTabButton(root, activeValue) : undefined;

    if (!root || !indicator || !activeTab) {
      return undefined;
    }

    const geometry = getIndicatorGeometry(activeTab, orientation);
    const selectionChanged = previousActiveValueRef.current !== activeValue;
    const previousIndex = previousIndexRef.current;
    const direction = activeIndex >= previousIndex ? 1 : -1;
    previousActiveValueRef.current = activeValue;
    previousIndexRef.current = activeIndex;

    if (reducedMotion || !hasPositionedIndicatorRef.current || !selectionChanged) {
      applyIndicatorGeometry(indicator, geometry);
      hasPositionedIndicatorRef.current = true;

      return undefined;
    }

    const scope = createScope({ root });
    const resolvedDuration = resolveDuration(duration, tokens.duration);
    const resolvedDistance = resolveDistance(distance, tokens.distance);
    const resolvedEasing = resolveEasing(easing, tokens.easing);
    const resolvedPanelEasing = resolveEasing(panelEasing, tokens.easing);

    scope.add(() => {
      animate(indicator, {
        duration: resolvedDuration,
        ease: resolvedEasing,
        height: geometry.height,
        width: geometry.width,
        x: geometry.x,
        y: geometry.y,
      });

      if (panel) {
        animate(panel, {
          duration: resolvedDuration,
          ease: resolvedPanelEasing,
          opacity: [0, 1],
          x: [direction * resolvedDistance, 0],
        });
      }
    });

    return () => {
      const indicatorSnapshot = {
        height: indicator.style.height,
        opacity: indicator.style.opacity,
        transform: indicator.style.transform,
        width: indicator.style.width,
      };

      scope.revert();

      if (indicator.isConnected) {
        Object.assign(indicator.style, indicatorSnapshot);
      }
    };
  }, [
    activeIndex,
    activeValue,
    distance,
    duration,
    easing,
    itemSignature,
    orientation,
    panelEasing,
    reducedMotion,
    tokens,
  ]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const tabList = root?.querySelector<HTMLElement>('[role="tablist"]');
    const indicator = root?.querySelector<HTMLElement>("[data-easecraft-tabs-indicator]");

    if (!root || !tabList || !indicator) {
      return undefined;
    }

    const updateIndicator = () => {
      const selectedTab = root.querySelector<HTMLButtonElement>(
        '[role="tab"][aria-selected="true"]',
      );

      if (selectedTab) {
        applyIndicatorGeometry(indicator, getIndicatorGeometry(selectedTab, orientation));
      }
    };

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateIndicator);

      return () => {
        window.removeEventListener("resize", updateIndicator);
      };
    }

    let observedInitialLayout = false;
    const observer = new ResizeObserver(() => {
      if (!observedInitialLayout) {
        observedInitialLayout = true;
        return;
      }

      updateIndicator();
    });
    observer.observe(tabList);
    tabList.querySelectorAll<HTMLElement>('[role="tab"]').forEach((tab) => {
      observer.observe(tab);
    });

    return () => {
      observer.disconnect();
    };
  }, [itemSignature, orientation]);

  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      rootRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef],
  );
  const tabList = createElement(
    "div",
    {
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-orientation": orientation,
      "data-easecraft-tabs-list": "",
      "data-orientation": orientation,
      role: "tablist",
      style: { position: "relative" },
    },
    records.map((record) => {
      const idPart = getIdPart(record.value);
      const selected = record.value === activeValue;

      return createElement(
        "button",
        {
          "aria-controls": `${rootId}-panel-${idPart}`,
          "aria-disabled": record.disabled ? "true" : undefined,
          "aria-selected": selected,
          "data-easecraft-tabs-trigger": "",
          "data-value": record.value,
          disabled: record.disabled,
          id: `${rootId}-tab-${idPart}`,
          key: record.value,
          onClick: () => {
            setFocusedValue(record.value);
            selectValue(record.value);
          },
          onFocus: () => {
            setFocusedValue(record.value);
          },
          onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
            handleKeyDown(event, record.value);
          },
          role: "tab",
          tabIndex: record.value === rovingValue ? 0 : -1,
          type: "button",
        },
        getLabel(record.item),
      );
    }),
    createElement("span", {
      "aria-hidden": "true",
      "data-easecraft-tabs-indicator": "",
      style: indicatorStyles,
    }),
  );
  const activeIdPart = activeValue ? getIdPart(activeValue) : undefined;
  const panel =
    activeRecord && activeIdPart
      ? createElement(
          "div",
          { "data-easecraft-tabs-panels": "" },
          createElement(
            "div",
            {
              "aria-labelledby": `${rootId}-tab-${activeIdPart}`,
              "data-easecraft-tabs-panel": "",
              id: `${rootId}-panel-${activeIdPart}`,
              role: "tabpanel",
              tabIndex: 0,
            },
            children(activeRecord.item),
          ),
        )
      : null;
  const hostProps = {
    ...elementProps,
    "data-activation-mode": activationMode,
    "data-orientation": orientation,
    id: rootId,
    ref: mergedRef,
  };

  return createElement(
    hostTag,
    // `hostTag` is restricted to intrinsic HTML elements, never function components.
    // eslint-disable-next-line react-hooks/refs
    hostProps,
    tabList,
    panel,
  );
}

const ForwardedAnimatedTabs = forwardRef(AnimatedTabsImplementation);
ForwardedAnimatedTabs.displayName = "AnimatedTabs";

export const AnimatedTabs = ForwardedAnimatedTabs as AnimatedTabsComponent;
