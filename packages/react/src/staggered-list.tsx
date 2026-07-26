import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";
import { stagger } from "animejs/utils";
import {
  createElement,
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ForwardedRef,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import type { EasingTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";
import type {
  StaggerDistance,
  StaggerDuration,
  StaggerEasing,
  StaggerInterval,
  StaggerOrder,
  StaggerPreset,
} from "./stagger.js";

export type StaggeredListTagName = "ol" | "ul";
export type StaggeredListItemState = "entering" | "present" | "exiting";

interface StaggeredListOwnProps<Item, TagName extends StaggeredListTagName> {
  readonly as?: TagName;
  readonly children: (item: Item, state: StaggeredListItemState) => ReactNode;
  readonly delay?: number;
  readonly distance?: StaggerDistance;
  readonly duration?: StaggerDuration;
  readonly easing?: StaggerEasing;
  readonly exitDuration?: StaggerDuration;
  readonly exitEasing?: StaggerEasing;
  readonly getKey: (item: Item) => Key;
  readonly interval?: StaggerInterval;
  readonly items: readonly Item[];
  readonly maxDelay?: StaggerDuration;
  readonly order?: StaggerOrder;
  readonly preset?: StaggerPreset;
  readonly reorderEasing?: StaggerEasing;
}

export type StaggeredListProps<
  Item,
  TagName extends StaggeredListTagName = "ul",
> = StaggeredListOwnProps<Item, TagName> &
  Omit<ComponentPropsWithoutRef<TagName>, keyof StaggeredListOwnProps<Item, TagName>>;

type StaggeredListComponent = <Item, TagName extends StaggeredListTagName = "ul">(
  props: StaggeredListProps<Item, TagName> & { readonly ref?: Ref<ComponentRef<TagName>> },
) => ReactElement | null;

interface ListRecord<Item> {
  readonly id: string;
  readonly item: Item;
  readonly key: Key;
  readonly state: StaggeredListItemState;
}

interface ItemPosition {
  readonly left: number;
  readonly top: number;
}

type ListElement = HTMLOListElement | HTMLUListElement;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function assignRef(ref: ForwardedRef<ListElement>, value: ListElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function serializeKey(key: Key): string {
  return `${typeof key}:${String(key)}`;
}

function createRecords<Item>(
  items: readonly Item[],
  getKey: (item: Item) => Key,
): ListRecord<Item>[] {
  const ids = new Set<string>();

  return items.map((item) => {
    const key = getKey(item);
    const id = serializeKey(key);

    if (ids.has(id)) {
      throw new Error(`StaggeredList received a duplicate key: ${String(key)}`);
    }

    ids.add(id);

    return { id, item, key, state: "entering" };
  });
}

function reconcileRecords<Item>(
  current: readonly ListRecord<Item>[],
  items: readonly Item[],
  getKey: (item: Item) => Key,
): ListRecord<Item>[] {
  const currentById = new Map(current.map((record) => [record.id, record]));
  const nextIds = new Set<string>();
  const nextRecords: ListRecord<Item>[] = items.map((item) => {
    const key = getKey(item);
    const id = serializeKey(key);

    if (nextIds.has(id)) {
      throw new Error(`StaggeredList received a duplicate key: ${String(key)}`);
    }

    nextIds.add(id);

    const existing = currentById.get(id);

    if (!existing) {
      return { id, item, key, state: "entering" as const };
    }

    return {
      ...existing,
      item,
      key,
      state: existing.state === "exiting" ? ("entering" as const) : existing.state,
    };
  });

  current.forEach((record, index) => {
    if (!nextIds.has(record.id)) {
      nextRecords.splice(Math.min(index, nextRecords.length), 0, {
        ...record,
        state: "exiting",
      });
    }
  });

  return nextRecords;
}

function resolveValue<TokenName extends string>(
  value: TokenName | number,
  tokens: Readonly<Record<TokenName, number>>,
): number {
  return typeof value === "number" ? value : tokens[value];
}

function resolveEasing(easing: StaggerEasing, tokens: EasingTokens): string {
  return Object.hasOwn(tokens, easing) ? tokens[easing as keyof EasingTokens] : easing;
}

function createBoundedDelay(
  count: number,
  interval: number,
  maxDelay: number,
  order: StaggerOrder,
  start: number,
) {
  const intervalCount = Math.max(count - 1, 1);
  const effectiveInterval = Math.min(Math.max(0, interval), Math.max(0, maxDelay) / intervalCount);

  return stagger(effectiveInterval, {
    from: order === "reverse" ? "last" : "first",
    start,
  });
}

function focusElement(element: HTMLElement) {
  const focusTarget = element.querySelector<HTMLElement>(focusableSelector) ?? element;

  focusTarget.focus({ preventScroll: true });
}

function moveFocusFromExitingItem(root: ListElement, item: HTMLLIElement) {
  if (!item.contains(document.activeElement)) {
    return;
  }

  let nextItem = item.nextElementSibling;

  while (nextItem instanceof HTMLLIElement && nextItem.dataset["state"] === "exiting") {
    nextItem = nextItem.nextElementSibling;
  }

  if (nextItem instanceof HTMLLIElement) {
    focusElement(nextItem);
    return;
  }

  let previousItem = item.previousElementSibling;

  while (previousItem instanceof HTMLLIElement && previousItem.dataset["state"] === "exiting") {
    previousItem = previousItem.previousElementSibling;
  }

  focusElement(previousItem instanceof HTMLLIElement ? previousItem : root);
}

function getDocumentPosition(element: HTMLLIElement): ItemPosition {
  const rect = element.getBoundingClientRect();

  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
  };
}

function StaggeredListImplementation(
  {
    as,
    children,
    delay = 0,
    distance = "medium",
    duration = "normal",
    easing = "enter",
    exitDuration = "fast",
    exitEasing = "exit",
    getKey,
    interval = "normal",
    items,
    maxDelay = "slow",
    order = "forward",
    preset = "fade-rise",
    reorderEasing = "move",
    ...elementProps
  }: StaggeredListProps<unknown, StaggeredListTagName>,
  forwardedRef: ForwardedRef<ListElement>,
) {
  const hostTag = as ?? "ul";
  const { reducedMotion, tokens } = useMotionConfig();
  const [records, setRecords] = useState(() => createRecords(items, getKey));
  const syncedItemsRef = useRef(items);
  const syncedGetKeyRef = useRef(getKey);
  const rootRef = useRef<ListElement>(null);
  const itemElementsRef = useRef(new Map<string, HTMLLIElement>());
  const positionsRef = useRef(new Map<string, ItemPosition>());

  useLayoutEffect(() => {
    if (syncedItemsRef.current === items && syncedGetKeyRef.current === getKey) {
      return;
    }

    syncedItemsRef.current = items;
    syncedGetKeyRef.current = getKey;
    setRecords((current) => reconcileRecords(current, items, getKey));
  }, [getKey, items]);

  useLayoutEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const scope = createScope({ root });

    const currentPositions = new Map<string, ItemPosition>();
    const entering: { element: HTMLLIElement; id: string }[] = [];
    const exiting: { element: HTMLLIElement; id: string }[] = [];
    const moving: { deltaX: number; deltaY: number; element: HTMLLIElement }[] = [];

    records.forEach((record) => {
      const element = itemElementsRef.current.get(record.id);

      if (!element) {
        return;
      }

      const currentPosition = getDocumentPosition(element);
      const previousPosition = positionsRef.current.get(record.id);
      currentPositions.set(record.id, currentPosition);

      if (record.state === "entering") {
        entering.push({ element, id: record.id });
      } else if (record.state === "exiting") {
        moveFocusFromExitingItem(root, element);
        exiting.push({ element, id: record.id });
      } else if (previousPosition) {
        const deltaX = previousPosition.left - currentPosition.left;
        const deltaY = previousPosition.top - currentPosition.top;

        if (deltaX !== 0 || deltaY !== 0) {
          moving.push({ deltaX, deltaY, element });
        }
      }
    });

    positionsRef.current = currentPositions;

    const finishEntering = () => {
      const enteringIds = new Set(entering.map(({ id }) => id));
      setRecords((current) =>
        current.map((record) =>
          enteringIds.has(record.id) && record.state === "entering"
            ? { ...record, state: "present" }
            : record,
        ),
      );
    };
    const finishExiting = () => {
      const exitingIds = new Set(exiting.map(({ id }) => id));
      setRecords((current) =>
        current.filter((record) => !(exitingIds.has(record.id) && record.state === "exiting")),
      );
    };

    if (reducedMotion) {
      if (entering.length > 0) {
        finishEntering();
      }

      if (exiting.length > 0) {
        finishExiting();
      }

      return () => {
        scope.revert();
      };
    }

    const resolvedDistance = resolveValue(distance, tokens.distance);
    const resolvedDuration = resolveValue(duration, tokens.duration);
    const resolvedExitDuration = resolveValue(exitDuration, tokens.duration);
    const resolvedInterval = resolveValue(interval, tokens.stagger);
    const resolvedMaxDelay = resolveValue(maxDelay, tokens.duration);
    const resolvedEasing = resolveEasing(easing, tokens.easing);
    const resolvedExitEasing = resolveEasing(exitEasing, tokens.easing);
    const resolvedReorderEasing = resolveEasing(reorderEasing, tokens.easing);

    if (entering.length > 0) {
      scope.add(() => {
        animate(
          entering.map(({ element }) => element),
          {
            delay: createBoundedDelay(
              entering.length,
              resolvedInterval,
              resolvedMaxDelay,
              order,
              delay,
            ),
            duration: resolvedDuration,
            ease: resolvedEasing,
            onComplete: finishEntering,
            ...(preset === "rise" ? {} : { opacity: [0, 1] }),
            ...(preset === "fade" ? {} : { y: [resolvedDistance, 0] }),
          },
        );
      });
    }

    if (exiting.length > 0) {
      scope.add(() => {
        animate(
          exiting.map(({ element }) => element),
          {
            delay: createBoundedDelay(exiting.length, resolvedInterval, resolvedMaxDelay, order, 0),
            duration: resolvedExitDuration,
            ease: resolvedExitEasing,
            onComplete: finishExiting,
            ...(preset === "rise" ? {} : { opacity: [1, 0] }),
            ...(preset === "fade" ? {} : { y: [0, -resolvedDistance] }),
          },
        );
      });
    }

    moving.forEach(({ deltaX, deltaY, element }) => {
      scope.add(() => {
        animate(element, {
          duration: resolvedDuration,
          ease: resolvedReorderEasing,
          x: [deltaX, 0],
          y: [deltaY, 0],
        });
      });
    });

    return () => {
      scope.revert();
    };
  }, [
    delay,
    distance,
    duration,
    easing,
    exitDuration,
    exitEasing,
    hostTag,
    interval,
    maxDelay,
    order,
    preset,
    records,
    reducedMotion,
    reorderEasing,
    tokens,
  ]);

  const mergedRef = useCallback(
    (element: ListElement | null) => {
      rootRef.current = element;
      assignRef(forwardedRef, element);
    },
    [forwardedRef],
  );
  const setItemElement = useCallback((id: string, element: HTMLLIElement | null) => {
    if (element) {
      itemElementsRef.current.set(id, element);
    } else {
      itemElementsRef.current.delete(id);
    }
  }, []);

  // Each callback ref runs after commit and never reads `itemElementsRef` during render.
  // eslint-disable-next-line react-hooks/refs
  const listItems = records.map((record) => {
    const itemProps = {
      "aria-hidden": record.state === "exiting" ? "true" : undefined,
      "data-easecraft-list-item": "",
      "data-state": record.state,
      inert: record.state === "exiting" ? true : undefined,
      key: record.id,
      ref: (element: HTMLLIElement | null) => {
        setItemElement(record.id, element);
      },
      tabIndex: -1,
    };

    return createElement("li", itemProps, children(record.item, record.state));
  });
  const hostProps = {
    ...elementProps,
    ref: mergedRef,
    tabIndex: elementProps.tabIndex ?? -1,
  };

  return createElement(
    hostTag,
    // `hostTag` is restricted to intrinsic list elements, never function components.
    // eslint-disable-next-line react-hooks/refs
    hostProps,
    listItems,
  );
}

const ForwardedStaggeredList = forwardRef(StaggeredListImplementation);
ForwardedStaggeredList.displayName = "StaggeredList";

export const StaggeredList = ForwardedStaggeredList as StaggeredListComponent;
