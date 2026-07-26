import {
  createElement,
  forwardRef,
  useCallback,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type CSSProperties,
  type ForwardedRef,
  type JSX,
  type Key,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import {
  StaggeredList,
  type StaggeredListItemState,
  type StaggeredListProps,
} from "./staggered-list.js";

export type FilterGridItemState = StaggeredListItemState;
export type FilterGridTagName = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements;

export interface FilterGridFilter<Item, Value extends string = string> {
  readonly disabled?: boolean;
  readonly label: ReactNode;
  readonly matches: (item: Item) => boolean;
  readonly value: Value;
}

interface FilterGridOwnProps<Item, Value extends string, TagName extends FilterGridTagName> {
  readonly as?: TagName;
  readonly children: (item: Item, state: FilterGridItemState) => ReactNode;
  readonly controlClassName?: string;
  readonly controlsClassName?: string;
  readonly controlsLabel?: string;
  readonly defaultValue?: Value;
  readonly empty?: ReactNode;
  readonly emptyClassName?: string;
  readonly filters: readonly FilterGridFilter<Item, Value>[];
  readonly getKey: (item: Item) => Key;
  readonly gridClassName?: string;
  readonly gridStyle?: CSSProperties;
  readonly items: readonly Item[];
  readonly onValueChange?: (value: Value) => void;
  readonly resultClassName?: string;
  readonly resultLabel?: (
    count: number,
    filter: FilterGridFilter<Item, Value> | undefined,
  ) => ReactNode;
  readonly value?: Value;
  readonly distance?: StaggeredListProps<Item>["distance"];
  readonly duration?: StaggeredListProps<Item>["duration"];
  readonly easing?: StaggeredListProps<Item>["easing"];
  readonly exitDuration?: StaggeredListProps<Item>["exitDuration"];
  readonly exitEasing?: StaggeredListProps<Item>["exitEasing"];
  readonly interval?: StaggeredListProps<Item>["interval"];
  readonly maxDelay?: StaggeredListProps<Item>["maxDelay"];
  readonly order?: StaggeredListProps<Item>["order"];
  readonly preset?: StaggeredListProps<Item>["preset"];
  readonly reorderEasing?: StaggeredListProps<Item>["reorderEasing"];
}

export type FilterGridProps<
  Item,
  Value extends string = string,
  TagName extends FilterGridTagName = "div",
> = FilterGridOwnProps<Item, Value, TagName> &
  Omit<ComponentPropsWithoutRef<TagName>, keyof FilterGridOwnProps<Item, Value, TagName>>;

type FilterGridComponent = <
  Item,
  Value extends string = string,
  TagName extends FilterGridTagName = "div",
>(
  props: FilterGridProps<Item, Value, TagName> & {
    readonly ref?: Ref<ComponentRef<TagName>>;
  },
) => ReactElement | null;

const defaultGridStyle: CSSProperties = {
  display: "grid",
  listStyle: "none",
  margin: 0,
  padding: 0,
};

function assignRef(ref: ForwardedRef<HTMLElement>, value: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function validateFilters<Item, Value extends string>(
  filters: readonly FilterGridFilter<Item, Value>[],
) {
  const values = new Set<string>();

  filters.forEach((filter) => {
    if (values.has(filter.value)) {
      throw new Error(`FilterGrid received a duplicate filter value: ${filter.value}`);
    }

    values.add(filter.value);
  });
}

function getEnabledFilter<Item, Value extends string>(
  filters: readonly FilterGridFilter<Item, Value>[],
  value: Value | undefined,
) {
  return filters.find((filter) => !filter.disabled && filter.value === value);
}

function getDefaultResultLabel(count: number) {
  return `${count.toString()} ${count === 1 ? "result" : "results"}`;
}

function FilterGridImplementation(
  {
    as,
    children,
    controlClassName,
    controlsClassName,
    controlsLabel = "Filter items",
    defaultValue,
    distance,
    duration,
    easing,
    empty = "No items match this filter.",
    emptyClassName,
    exitDuration,
    exitEasing,
    filters,
    getKey,
    gridClassName,
    gridStyle,
    interval,
    items,
    maxDelay,
    onValueChange,
    order,
    preset,
    reorderEasing,
    resultClassName,
    resultLabel,
    value,
    ...elementProps
  }: FilterGridProps<unknown, string, FilterGridTagName>,
  forwardedRef: ForwardedRef<HTMLElement>,
) {
  validateFilters(filters);
  const hostTag = as ?? "div";
  const generatedId = useId();
  const resultsId = `${elementProps.id ?? `easecraft-filter-${generatedId}`}-results`;
  const firstEnabledFilter = filters.find((filter) => !filter.disabled);
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(
    () => getEnabledFilter(filters, defaultValue)?.value ?? firstEnabledFilter?.value,
  );
  const activeFilter = getEnabledFilter(filters, value ?? uncontrolledValue) ?? firstEnabledFilter;
  const activeValue = activeFilter?.value;
  const filteredItems = activeFilter ? items.filter(activeFilter.matches) : [];
  const resultText = resultLabel
    ? resultLabel(filteredItems.length, activeFilter)
    : getDefaultResultLabel(filteredItems.length);

  function selectFilter(filter: FilterGridFilter<unknown>) {
    if (filter.disabled || filter.value === activeValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(filter.value);
    }

    onValueChange?.(filter.value);
  }

  const mergedRef = useCallback(
    (element: HTMLElement | null) => {
      assignRef(forwardedRef, element);
    },
    [forwardedRef],
  );
  const hostProps = { ...elementProps, ref: mergedRef };
  const grid = (
    <StaggeredList
      {...(distance === undefined ? {} : { distance })}
      {...(duration === undefined ? {} : { duration })}
      {...(easing === undefined ? {} : { easing })}
      {...(exitDuration === undefined ? {} : { exitDuration })}
      {...(exitEasing === undefined ? {} : { exitEasing })}
      {...(interval === undefined ? {} : { interval })}
      {...(maxDelay === undefined ? {} : { maxDelay })}
      {...(order === undefined ? {} : { order })}
      {...(preset === undefined ? {} : { preset })}
      {...(reorderEasing === undefined ? {} : { reorderEasing })}
      aria-labelledby={resultsId}
      className={gridClassName}
      getKey={getKey}
      items={filteredItems}
      style={{ ...defaultGridStyle, ...gridStyle }}
    >
      {children}
    </StaggeredList>
  );

  return createElement(
    hostTag,
    // `hostTag` is restricted to intrinsic HTML elements, never function components.
    // eslint-disable-next-line react-hooks/refs
    hostProps,
    createElement(
      "div",
      {
        "aria-label": controlsLabel,
        className: controlsClassName,
        "data-easecraft-filter-controls": "",
        role: "group",
      },
      filters.map((filter) =>
        createElement(
          "button",
          {
            "aria-pressed": filter.value === activeValue,
            className: controlClassName,
            "data-easecraft-filter-control": "",
            "data-value": filter.value,
            disabled: filter.disabled,
            key: filter.value,
            onClick: () => {
              selectFilter(filter);
            },
            type: "button",
          },
          filter.label,
        ),
      ),
    ),
    createElement(
      "span",
      {
        "aria-atomic": "true",
        "aria-live": "polite",
        className: resultClassName,
        "data-easecraft-filter-results": "",
        id: resultsId,
        role: "status",
      },
      resultText,
    ),
    grid,
    filteredItems.length === 0
      ? createElement(
          "div",
          {
            className: emptyClassName,
            "data-easecraft-filter-empty": "",
          },
          empty,
        )
      : null,
  );
}

const ForwardedFilterGrid = forwardRef(FilterGridImplementation);
ForwardedFilterGrid.displayName = "FilterGrid";

export const FilterGrid = ForwardedFilterGrid as FilterGridComponent;
