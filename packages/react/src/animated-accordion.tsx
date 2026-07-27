import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";
import * as Accordion from "@radix-ui/react-accordion";
import {
  createElement,
  forwardRef,
  useCallback,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type CSSProperties,
  type ForwardedRef,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import type { DurationTokens, EasingTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";

export type AnimatedAccordionMode = "single" | "multiple";
export type AnimatedAccordionState = "closed" | "opening" | "open" | "closing";
export type AnimatedAccordionDuration = keyof DurationTokens | number;
export type AnimatedAccordionEasing = keyof EasingTokens | (string & Record<never, never>);
export type AnimatedAccordionHeadingLevel = 2 | 3 | 4 | 5 | 6;
export type AnimatedAccordionTagName = keyof HTMLElementTagNameMap & keyof JSX.IntrinsicElements;

interface AnimatedAccordionBaseProps<
  Item,
  Value extends string,
  TagName extends AnimatedAccordionTagName,
> {
  readonly as?: TagName;
  readonly bodyClassName?: string;
  readonly children: (item: Item) => ReactNode;
  readonly contentClassName?: string;
  readonly contentStyle?: CSSProperties;
  readonly disabled?: boolean;
  readonly duration?: AnimatedAccordionDuration;
  readonly easing?: AnimatedAccordionEasing;
  readonly exitDuration?: AnimatedAccordionDuration;
  readonly exitEasing?: AnimatedAccordionEasing;
  readonly getLabel: (item: Item) => ReactNode;
  readonly getValue: (item: Item) => Value;
  readonly headerClassName?: string;
  readonly headingLevel?: AnimatedAccordionHeadingLevel;
  readonly isDisabled?: (item: Item) => boolean;
  readonly itemClassName?: string;
  readonly items: readonly Item[];
  readonly triggerClassName?: string;
}

interface AnimatedAccordionSingleOwnProps<
  Item,
  Value extends string,
  TagName extends AnimatedAccordionTagName,
> extends AnimatedAccordionBaseProps<Item, Value, TagName> {
  readonly collapsible?: boolean;
  readonly defaultValue?: Value;
  readonly mode?: "single";
  readonly onValueChange?: (value: Value | undefined) => void;
  readonly value?: Value | undefined;
}

interface AnimatedAccordionMultipleOwnProps<
  Item,
  Value extends string,
  TagName extends AnimatedAccordionTagName,
> extends AnimatedAccordionBaseProps<Item, Value, TagName> {
  readonly collapsible?: never;
  readonly defaultValue?: readonly Value[];
  readonly mode: "multiple";
  readonly onValueChange?: (value: readonly Value[]) => void;
  readonly value?: readonly Value[];
}

type AnimatedAccordionOwnProps<
  Item,
  Value extends string,
  TagName extends AnimatedAccordionTagName,
> =
  | AnimatedAccordionSingleOwnProps<Item, Value, TagName>
  | AnimatedAccordionMultipleOwnProps<Item, Value, TagName>;

type AnimatedAccordionPropKey =
  | keyof AnimatedAccordionBaseProps<unknown, string, AnimatedAccordionTagName>
  | "collapsible"
  | "defaultValue"
  | "mode"
  | "onValueChange"
  | "value";

export type AnimatedAccordionProps<
  Item,
  Value extends string = string,
  TagName extends AnimatedAccordionTagName = "div",
> = AnimatedAccordionOwnProps<Item, Value, TagName> &
  Omit<ComponentPropsWithoutRef<TagName>, AnimatedAccordionPropKey>;

type AnimatedAccordionComponent = <
  Item,
  Value extends string = string,
  TagName extends AnimatedAccordionTagName = "div",
>(
  props: AnimatedAccordionProps<Item, Value, TagName> & {
    readonly ref?: Ref<ComponentRef<TagName>>;
  },
) => ReactElement | null;

interface InternalAnimatedAccordionProps
  extends
    AnimatedAccordionBaseProps<unknown, string, AnimatedAccordionTagName>,
    Omit<ComponentPropsWithoutRef<AnimatedAccordionTagName>, AnimatedAccordionPropKey> {
  readonly collapsible?: boolean;
  readonly defaultValue?: string | readonly string[];
  readonly mode?: AnimatedAccordionMode;
  readonly onValueChange?: (value: string | readonly string[] | undefined) => void;
  readonly value?: string | readonly string[];
}

interface AccordionRecord {
  readonly content: ReactNode;
  readonly disabled: boolean;
  readonly label: ReactNode;
  readonly value: string;
}

interface PanelMachine {
  readonly state: AnimatedAccordionState;
  readonly transitionId: number;
}

type PanelAction =
  | { readonly open: boolean; readonly type: "sync" }
  | { readonly transitionId: number; readonly type: "complete" };

interface MotionStyleSnapshot {
  readonly height: string;
  readonly opacity: string;
  readonly overflow: string;
}

interface AnimatedAccordionPanelProps {
  readonly bodyClassName: string | undefined;
  readonly children: ReactNode;
  readonly className: string | undefined;
  readonly contentId: string;
  readonly duration: AnimatedAccordionDuration;
  readonly easing: AnimatedAccordionEasing;
  readonly exitDuration: AnimatedAccordionDuration;
  readonly exitEasing: AnimatedAccordionEasing;
  readonly open: boolean;
  readonly style: CSSProperties | undefined;
  readonly triggerId: string;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
}

interface AnimatedAccordionItemProps extends Omit<
  AnimatedAccordionPanelProps,
  "contentId" | "open" | "triggerId" | "triggerRef"
> {
  readonly disabled: boolean;
  readonly headerClassName: string | undefined;
  readonly headingLevel: AnimatedAccordionHeadingLevel;
  readonly itemClassName: string | undefined;
  readonly label: ReactNode;
  readonly open: boolean;
  readonly triggerClassName: string | undefined;
  readonly value: string;
}

function assignRef(ref: ForwardedRef<HTMLElement>, value: HTMLElement | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

function createRecords(
  items: readonly unknown[],
  getLabel: (item: unknown) => ReactNode,
  getValue: (item: unknown) => string,
  isDisabled: ((item: unknown) => boolean) | undefined,
  renderContent: (item: unknown) => ReactNode,
): AccordionRecord[] {
  const values = new Set<string>();

  return items.map((item) => {
    const value = getValue(item);

    if (values.has(value)) {
      throw new Error(`AnimatedAccordion received a duplicate value: ${value}`);
    }

    values.add(value);

    return {
      content: renderContent(item),
      disabled: isDisabled?.(item) ?? false,
      label: getLabel(item),
      value,
    };
  });
}

function createInitialPanelMachine(open: boolean): PanelMachine {
  return { state: open ? "open" : "closed", transitionId: 0 };
}

function syncPanel(machine: PanelMachine, open: boolean): PanelMachine {
  if (open && (machine.state === "closed" || machine.state === "closing")) {
    return { state: "opening", transitionId: machine.transitionId + 1 };
  }

  if (!open && (machine.state === "open" || machine.state === "opening")) {
    return { state: "closing", transitionId: machine.transitionId + 1 };
  }

  return machine;
}

function completePanel(machine: PanelMachine, transitionId: number): PanelMachine {
  if (machine.transitionId !== transitionId) {
    return machine;
  }

  if (machine.state === "opening") {
    return { ...machine, state: "open" };
  }

  if (machine.state === "closing") {
    return { ...machine, state: "closed" };
  }

  return machine;
}

function panelReducer(machine: PanelMachine, action: PanelAction): PanelMachine {
  return action.type === "sync"
    ? syncPanel(machine, action.open)
    : completePanel(machine, action.transitionId);
}

function resolveDuration(duration: AnimatedAccordionDuration, tokens: DurationTokens): number {
  return typeof duration === "number" ? duration : tokens[duration];
}

function resolveEasing(easing: AnimatedAccordionEasing, tokens: EasingTokens): string {
  return Object.hasOwn(tokens, easing) ? tokens[easing as keyof EasingTokens] : easing;
}

function getMotionStyle(element: HTMLElement): MotionStyleSnapshot {
  return {
    height: element.style.height,
    opacity: element.style.opacity,
    overflow: element.style.overflow,
  };
}

function applyMotionStyle(element: HTMLElement, snapshot: MotionStyleSnapshot) {
  element.style.height = snapshot.height;
  element.style.opacity = snapshot.opacity;
  element.style.overflow = snapshot.overflow;
}

function AnimatedAccordionPanel({
  bodyClassName,
  children,
  className,
  contentId,
  duration,
  easing,
  exitDuration,
  exitEasing,
  open,
  style,
  triggerId,
  triggerRef,
}: AnimatedAccordionPanelProps) {
  const { reducedMotion, tokens } = useMotionConfig();
  const [machine, dispatch] = useReducer(panelReducer, open, createInitialPanelMachine);
  const animationIdRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const authoredStyleRef = useRef<MotionStyleSnapshot | null>(null);

  useLayoutEffect(() => {
    dispatch({ open, type: "sync" });
  }, [open]);

  useLayoutEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return undefined;
    }

    animationIdRef.current += 1;
    const animationId = animationIdRef.current;
    authoredStyleRef.current ??= getMotionStyle(content);
    const authoredStyle = authoredStyleRef.current;

    if (machine.state === "open" || machine.state === "closed") {
      applyMotionStyle(content, authoredStyle);
      return undefined;
    }

    if (machine.state === "closing" && content.contains(document.activeElement)) {
      triggerRef.current?.focus({ preventScroll: true });
    }

    let completed = false;
    const complete = () => {
      if (animationIdRef.current !== animationId) {
        return;
      }

      completed = true;

      if (machine.state === "closing") {
        content.hidden = true;
      } else {
        applyMotionStyle(content, authoredStyle);
      }

      dispatch({ transitionId: machine.transitionId, type: "complete" });
    };

    if (reducedMotion) {
      complete();
      return undefined;
    }

    const body = content.querySelector<HTMLElement>("[data-easecraft-accordion-body]");

    if (!body) {
      complete();
      return undefined;
    }

    const opening = machine.state === "opening";
    const measuredHeight = body.scrollHeight;
    const currentHeight = content.getBoundingClientRect().height || measuredHeight;
    const interrupted =
      content.style.height !== authoredStyle.height ||
      content.style.opacity !== authoredStyle.opacity;
    const scope = createScope({ root: content });
    const resolvedDuration = resolveDuration(opening ? duration : exitDuration, tokens.duration);
    const resolvedEasing = resolveEasing(opening ? easing : exitEasing, tokens.easing);
    content.style.overflow = "hidden";

    scope.add(() => {
      animate(content, {
        duration: resolvedDuration,
        ease: resolvedEasing,
        height: opening ? (interrupted ? measuredHeight : [0, measuredHeight]) : [currentHeight, 0],
        onComplete: complete,
        opacity: opening ? (interrupted ? 1 : [0, 1]) : 0,
      });
    });

    return () => {
      if (animationIdRef.current === animationId) {
        animationIdRef.current += 1;
      }

      const interruptedStyle = getMotionStyle(content);
      scope.revert();

      if (!completed) {
        applyMotionStyle(content, interruptedStyle);

        queueMicrotask(() => {
          if (!content.isConnected) {
            applyMotionStyle(content, authoredStyle);
          }
        });
      }
    };
  }, [
    duration,
    easing,
    exitDuration,
    exitEasing,
    machine.state,
    machine.transitionId,
    reducedMotion,
    tokens,
    triggerRef,
  ]);

  const closing = machine.state === "closing";

  return (
    <Accordion.Content
      aria-labelledby={triggerId}
      aria-hidden={closing || undefined}
      className={className}
      data-easecraft-accordion-content=""
      data-easecraft-state={machine.state}
      forceMount
      hidden={machine.state === "closed"}
      id={contentId}
      inert={closing || undefined}
      ref={contentRef}
      style={style}
    >
      <div className={bodyClassName} data-easecraft-accordion-body="">
        {children}
      </div>
    </Accordion.Content>
  );
}

function AnimatedAccordionItem({
  bodyClassName,
  children,
  className,
  disabled,
  duration,
  easing,
  exitDuration,
  exitEasing,
  headerClassName,
  headingLevel,
  itemClassName,
  label,
  open,
  style,
  triggerClassName,
  value,
}: AnimatedAccordionItemProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const triggerId = `easecraft-accordion-trigger-${generatedId}`;
  const contentId = `easecraft-accordion-content-${generatedId}`;
  const heading = createElement(
    `h${headingLevel.toString()}`,
    { className: headerClassName },
    <Accordion.Trigger
      aria-controls={contentId}
      className={triggerClassName}
      data-easecraft-accordion-trigger=""
      id={triggerId}
      ref={triggerRef}
    >
      {label}
      <span aria-hidden="true" data-easecraft-accordion-indicator="" />
    </Accordion.Trigger>,
  );

  return (
    <Accordion.Item
      className={itemClassName}
      data-easecraft-accordion-item=""
      disabled={disabled}
      value={value}
    >
      <Accordion.Header asChild>{heading}</Accordion.Header>
      <AnimatedAccordionPanel
        bodyClassName={bodyClassName}
        className={className}
        contentId={contentId}
        duration={duration}
        easing={easing}
        exitDuration={exitDuration}
        exitEasing={exitEasing}
        open={open}
        style={style}
        triggerId={triggerId}
        triggerRef={triggerRef}
      >
        {children}
      </AnimatedAccordionPanel>
    </Accordion.Item>
  );
}

function AnimatedAccordionImplementation(
  props: InternalAnimatedAccordionProps,
  forwardedRef: ForwardedRef<HTMLElement>,
) {
  const controlled = Object.hasOwn(props, "value");
  const {
    as,
    bodyClassName,
    children,
    collapsible = true,
    contentClassName,
    contentStyle,
    defaultValue,
    disabled = false,
    duration = "normal",
    easing = "enter",
    exitDuration = "fast",
    exitEasing = "exit",
    getLabel,
    getValue,
    headerClassName,
    headingLevel = 3,
    isDisabled,
    itemClassName,
    items,
    mode = "single",
    onValueChange,
    triggerClassName,
    value,
    ...elementProps
  } = props;
  const hostTag = as ?? "div";
  const [uncontrolledValue, setUncontrolledValue] = useState<
    string | readonly string[] | undefined
  >(() => defaultValue);
  const requestedValue = controlled ? value : uncontrolledValue;
  const singleValue = typeof requestedValue === "string" ? requestedValue : undefined;
  const multipleValue: readonly string[] =
    typeof requestedValue === "string" || requestedValue === undefined ? [] : requestedValue;
  const openValues = new Set(mode === "multiple" ? multipleValue : [singleValue]);
  const records = createRecords(items, getLabel, getValue, isDisabled, children);
  const mergedRef = useCallback(
    (element: HTMLDivElement | null) => {
      assignRef(forwardedRef, element);
    },
    [forwardedRef],
  );
  const renderedItems = records.map((record) => (
    <AnimatedAccordionItem
      bodyClassName={bodyClassName}
      className={contentClassName}
      disabled={record.disabled}
      duration={duration}
      easing={easing}
      exitDuration={exitDuration}
      exitEasing={exitEasing}
      headerClassName={headerClassName}
      headingLevel={headingLevel}
      itemClassName={itemClassName}
      key={record.value}
      label={record.label}
      open={openValues.has(record.value)}
      style={contentStyle}
      triggerClassName={triggerClassName}
      value={record.value}
    >
      {record.content}
    </AnimatedAccordionItem>
  ));
  const host = createElement(
    hostTag,
    {
      ...elementProps,
      "data-easecraft-accordion": "",
      role:
        elementProps.role ??
        (elementProps["aria-label"] || elementProps["aria-labelledby"] ? "group" : undefined),
    },
    renderedItems,
  );

  if (mode === "multiple") {
    return (
      <Accordion.Root
        asChild
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (!controlled) {
            setUncontrolledValue(nextValue);
          }

          onValueChange?.(nextValue);
        }}
        ref={mergedRef}
        type="multiple"
        value={[...multipleValue]}
      >
        {host}
      </Accordion.Root>
    );
  }

  return (
    <Accordion.Root
      asChild
      collapsible={collapsible}
      disabled={disabled}
      onValueChange={(nextValue) => {
        const normalizedValue = nextValue || undefined;

        if (!controlled) {
          setUncontrolledValue(normalizedValue);
        }

        onValueChange?.(normalizedValue);
      }}
      ref={mergedRef}
      type="single"
      value={singleValue ?? ""}
    >
      {host}
    </Accordion.Root>
  );
}

const ForwardedAnimatedAccordion = forwardRef(AnimatedAccordionImplementation);
ForwardedAnimatedAccordion.displayName = "AnimatedAccordion";

export const AnimatedAccordion = ForwardedAnimatedAccordion as AnimatedAccordionComponent;
