import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";
import * as Toast from "@radix-ui/react-toast";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { DistanceTokens, DurationTokens, EasingTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";

export type ToastStackId = string | number;
export type ToastStackPriority = "polite" | "assertive";
export type ToastStackState = "entering" | "present" | "exiting";
export type ToastStackDismissReason = "action" | "close" | "escape" | "swipe" | "timeout";
export type ToastStackSwipeDirection = "up" | "down" | "left" | "right";
export type ToastStackDuration = keyof DurationTokens | number;
export type ToastStackDistance = keyof DistanceTokens | number;
export type ToastStackEasing = keyof EasingTokens | (string & Record<never, never>);

export interface ToastStackAction {
  readonly altText: string;
  readonly label: ReactNode;
  readonly onClick?: () => void;
}

export interface ToastStackItem<Id extends ToastStackId = string> {
  readonly action?: ToastStackAction;
  readonly description?: ReactNode;
  readonly duration?: number;
  readonly id: Id;
  readonly priority?: ToastStackPriority;
  readonly title: ReactNode;
}

export interface ToastStackProps<Id extends ToastStackId = string> {
  readonly actionClassName?: string;
  readonly announcerContainer?: Element | DocumentFragment;
  readonly closeClassName?: string;
  readonly closeLabel?: string;
  readonly contentClassName?: string;
  readonly contentStyle?: CSSProperties;
  readonly distance?: ToastStackDistance;
  readonly duration?: number;
  readonly easing?: ToastStackEasing;
  readonly entryDuration?: ToastStackDuration;
  readonly exitDuration?: ToastStackDuration;
  readonly exitEasing?: ToastStackEasing;
  readonly hotkey?: string[];
  readonly items: readonly ToastStackItem<Id>[];
  readonly label?: string;
  readonly limit?: number;
  readonly onDismiss: (id: Id, reason: ToastStackDismissReason) => void;
  readonly onPauseChange?: (id: Id, paused: boolean) => void;
  readonly reflowDuration?: ToastStackDuration;
  readonly reflowEasing?: ToastStackEasing;
  readonly swipeDirection?: ToastStackSwipeDirection;
  readonly swipeThreshold?: number;
  readonly toastClassName?: string;
  readonly toastStyle?: CSSProperties;
  readonly viewportClassName?: string;
  readonly viewportLabel?: string;
  readonly viewportStyle?: CSSProperties;
}

interface ToastRecord<Id extends ToastStackId> {
  readonly id: string;
  readonly item: ToastStackItem<Id>;
  readonly state: ToastStackState;
}

interface ItemPosition {
  readonly left: number;
  readonly top: number;
}

interface ToastMotionLayerProps<Id extends ToastStackId> {
  readonly actionClassName: string | undefined;
  readonly closeClassName: string | undefined;
  readonly closeLabel: string;
  readonly contentClassName: string | undefined;
  readonly contentStyle: CSSProperties | undefined;
  readonly distance: ToastStackDistance;
  readonly duration: ToastStackDuration;
  readonly easing: ToastStackEasing;
  readonly exitDuration: ToastStackDuration;
  readonly exitEasing: ToastStackEasing;
  readonly item: ToastStackItem<Id>;
  readonly onComplete: (id: string, state: ToastStackState) => void;
  readonly onDismiss: (id: string, reason: ToastStackDismissReason) => void;
  readonly onPauseChange: ((id: Id, paused: boolean) => void) | undefined;
  readonly registerElement: (id: string, element: HTMLLIElement | null) => void;
  readonly state: ToastStackState;
  readonly toastClassName: string | undefined;
  readonly toastStyle: CSSProperties | undefined;
}

const defaultViewportStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  listStyle: "none",
  margin: 0,
  maxWidth: "calc(100vw - 32px)",
  padding: 0,
  position: "fixed",
  right: 16,
  top: 16,
  width: "24rem",
  zIndex: 60,
};

const defaultToastStyle: CSSProperties = {
  transform:
    "translate3d(var(--radix-toast-swipe-move-x, var(--radix-toast-swipe-end-x, 0)), var(--radix-toast-swipe-move-y, var(--radix-toast-swipe-end-y, 0)), 0)",
};

const defaultContentStyle: CSSProperties = {
  background: "var(--easecraft-toast-background, Canvas)",
  border: "1px solid var(--easecraft-toast-border, GrayText)",
  borderRadius: "var(--easecraft-toast-radius, 6px)",
  boxShadow: "var(--easecraft-toast-shadow, 0 8px 24px rgb(0 0 0 / 0.16))",
  color: "var(--easecraft-toast-foreground, CanvasText)",
  display: "grid",
  gap: 8,
  padding: "var(--easecraft-toast-padding, 16px)",
};

function serializeId(id: ToastStackId): string {
  return `${typeof id}:${String(id)}`;
}

function getLimit(limit: number): number {
  return Math.max(1, Math.floor(limit));
}

function validateItems<Id extends ToastStackId>(items: readonly ToastStackItem<Id>[]) {
  const ids = new Set<string>();

  items.forEach((item) => {
    const id = serializeId(item.id);

    if (ids.has(id)) {
      throw new Error(`ToastStack received a duplicate id: ${String(item.id)}`);
    }

    ids.add(id);
  });
}

function createInitialRecords<Id extends ToastStackId>(
  items: readonly ToastStackItem<Id>[],
  limit: number,
): ToastRecord<Id>[] {
  validateItems(items);

  return items.slice(0, getLimit(limit)).map((item) => ({
    id: serializeId(item.id),
    item,
    state: "entering",
  }));
}

function reconcileRecords<Id extends ToastStackId>(
  current: readonly ToastRecord<Id>[],
  items: readonly ToastStackItem<Id>[],
  dismissedIds: ReadonlySet<string>,
  limit: number,
): ToastRecord<Id>[] {
  validateItems(items);
  const itemById = new Map(items.map((item) => [serializeId(item.id), item]));
  const normalizedLimit = getLimit(limit);
  let visibleCount = 0;
  const next = current.map((record) => {
    const item = itemById.get(record.id);

    if (!item || dismissedIds.has(record.id)) {
      return record.state === "exiting" ? record : { ...record, state: "exiting" as const };
    }

    if (record.state !== "exiting") {
      visibleCount += 1;

      if (visibleCount > normalizedLimit) {
        return { ...record, item, state: "exiting" as const };
      }
    }

    return { ...record, item };
  });
  const existingIds = new Set(next.map((record) => record.id));
  let available = normalizedLimit - next.length;

  for (const item of items) {
    const id = serializeId(item.id);

    if (available <= 0) {
      break;
    }

    if (!existingIds.has(id) && !dismissedIds.has(id)) {
      next.push({ id, item, state: "entering" });
      existingIds.add(id);
      available -= 1;
    }
  }

  return next;
}

function resolveDuration(duration: ToastStackDuration, tokens: DurationTokens): number {
  return typeof duration === "number" ? duration : tokens[duration];
}

function resolveDistance(distance: ToastStackDistance, tokens: DistanceTokens): number {
  return typeof distance === "number" ? distance : tokens[distance];
}

function resolveEasing(easing: ToastStackEasing, tokens: EasingTokens): string {
  return Object.hasOwn(tokens, easing) ? tokens[easing as keyof EasingTokens] : easing;
}

function getDocumentPosition(element: HTMLElement): ItemPosition {
  const rect = element.getBoundingClientRect();

  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
  };
}

function ToastMotionLayer<Id extends ToastStackId>({
  actionClassName,
  closeClassName,
  closeLabel,
  contentClassName,
  contentStyle,
  distance,
  duration,
  easing,
  exitDuration,
  exitEasing,
  item,
  onComplete,
  onDismiss,
  onPauseChange,
  registerElement,
  state,
  toastClassName,
  toastStyle,
}: ToastMotionLayerProps<Id>) {
  const { reducedMotion, tokens } = useMotionConfig();
  const [toastElement, setToastElement] = useState<HTMLLIElement | null>(null);
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const reasonRef = useRef<ToastStackDismissReason | null>(null);
  const id = serializeId(item.id);

  useLayoutEffect(() => {
    registerElement(id, toastElement);

    return () => {
      registerElement(id, null);
    };
  }, [id, registerElement, toastElement]);

  useLayoutEffect(() => {
    if (!toastElement || !contentElement || state === "present") {
      return undefined;
    }

    if (reducedMotion) {
      onComplete(id, state);
      return undefined;
    }

    const scope = createScope({ root: toastElement });
    const entering = state === "entering";
    const resolvedDuration = resolveDuration(entering ? duration : exitDuration, tokens.duration);
    const resolvedDistance = resolveDistance(distance, tokens.distance);
    const resolvedEasing = resolveEasing(entering ? easing : exitEasing, tokens.easing);

    scope.add(() => {
      animate(contentElement, {
        duration: resolvedDuration,
        ease: resolvedEasing,
        onComplete: () => {
          onComplete(id, state);
        },
        opacity: entering ? [0, 1] : 0,
        x: entering ? [resolvedDistance, 0] : resolvedDistance,
      });
    });

    return () => {
      scope.revert();
    };
  }, [
    distance,
    duration,
    easing,
    exitDuration,
    exitEasing,
    id,
    onComplete,
    reducedMotion,
    state,
    contentElement,
    toastElement,
    tokens,
  ]);

  function setReason(reason: ToastStackDismissReason) {
    reasonRef.current = reason;
  }

  return (
    <Toast.Root
      className={toastClassName}
      data-easecraft-toast=""
      data-easecraft-toast-id={id}
      data-easecraft-toast-priority={item.priority ?? "polite"}
      data-easecraft-toast-state={state}
      forceMount
      onEscapeKeyDown={() => {
        setReason("escape");
      }}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss(id, reasonRef.current ?? "timeout");
          reasonRef.current = null;
        }
      }}
      onPause={() => {
        onPauseChange?.(item.id, true);
      }}
      onResume={() => {
        onPauseChange?.(item.id, false);
      }}
      onSwipeEnd={() => {
        setReason("swipe");
      }}
      open={state !== "exiting"}
      ref={setToastElement}
      style={{ ...defaultToastStyle, ...toastStyle }}
      type={item.priority === "assertive" ? "foreground" : "background"}
      {...(item.duration === undefined ? {} : { duration: item.duration })}
    >
      <div
        className={contentClassName}
        data-easecraft-toast-content=""
        ref={setContentElement}
        style={{ ...defaultContentStyle, ...contentStyle }}
      >
        <Toast.Title data-easecraft-toast-title="">{item.title}</Toast.Title>
        {item.description ? (
          <Toast.Description data-easecraft-toast-description="">
            {item.description}
          </Toast.Description>
        ) : null}
        {item.action ? (
          <Toast.Action
            altText={item.action.altText}
            className={actionClassName}
            data-easecraft-toast-action=""
            onClick={() => {
              setReason("action");
              item.action?.onClick?.();
            }}
          >
            {item.action.label}
          </Toast.Action>
        ) : null}
        <Toast.Close
          aria-label={closeLabel}
          className={closeClassName}
          data-easecraft-toast-close=""
          onClick={() => {
            setReason("close");
          }}
          type="button"
        >
          {closeLabel}
        </Toast.Close>
      </div>
    </Toast.Root>
  );
}

export function ToastStack<Id extends ToastStackId = string>({
  actionClassName,
  announcerContainer,
  closeClassName,
  closeLabel = "Dismiss notification",
  contentClassName,
  contentStyle,
  distance = "medium",
  duration = 5000,
  easing = "enter",
  entryDuration = "normal",
  exitDuration = "fast",
  exitEasing = "exit",
  hotkey = ["F8"],
  items,
  label = "Notification",
  limit = 3,
  onDismiss,
  onPauseChange,
  reflowDuration = "normal",
  reflowEasing = "move",
  swipeDirection = "right",
  swipeThreshold = 50,
  toastClassName,
  toastStyle,
  viewportClassName,
  viewportLabel = "Notifications ({hotkey})",
  viewportStyle,
}: ToastStackProps<Id>) {
  const { reducedMotion, tokens } = useMotionConfig();
  const [records, setRecords] = useState(() => createInitialRecords(items, limit));
  const syncedItemsRef = useRef(items);
  const syncedLimitRef = useRef(limit);
  const dismissedIdsRef = useRef(new Set<string>());
  const requestedDismissIdsRef = useRef(new Set<string>());
  const itemElementsRef = useRef(new Map<string, HTMLLIElement>());
  const positionsRef = useRef(new Map<string, ItemPosition>());

  useLayoutEffect(() => {
    if (syncedItemsRef.current === items && syncedLimitRef.current === limit) {
      return;
    }

    const itemIds = new Set(items.map((item) => serializeId(item.id)));

    dismissedIdsRef.current.forEach((id) => {
      if (!itemIds.has(id)) {
        dismissedIdsRef.current.delete(id);
        requestedDismissIdsRef.current.delete(id);
      }
    });
    syncedItemsRef.current = items;
    syncedLimitRef.current = limit;
    setRecords((current) => reconcileRecords(current, items, dismissedIdsRef.current, limit));
  }, [items, limit]);

  function completeMotion(id: string, state: ToastStackState) {
    if (state === "entering") {
      setRecords((current) =>
        current.map((record) =>
          record.id === id && record.state === "entering"
            ? { ...record, state: "present" }
            : record,
        ),
      );
      return;
    }

    if (state === "exiting") {
      setRecords((current) => {
        const withoutExited = current.filter(
          (record) => !(record.id === id && record.state === "exiting"),
        );

        return reconcileRecords(withoutExited, items, dismissedIdsRef.current, limit);
      });
      positionsRef.current.delete(id);
      itemElementsRef.current.delete(id);
    }
  }

  function requestDismiss(id: string, reason: ToastStackDismissReason) {
    if (requestedDismissIdsRef.current.has(id)) {
      return;
    }

    const record = records.find((candidate) => candidate.id === id);

    if (!record) {
      return;
    }

    requestedDismissIdsRef.current.add(id);
    dismissedIdsRef.current.add(id);
    setRecords((current) =>
      current.map((candidate) =>
        candidate.id === id ? { ...candidate, state: "exiting" } : candidate,
      ),
    );
    onDismiss(record.item.id, reason);
  }

  function registerElement(id: string, element: HTMLLIElement | null) {
    if (element) {
      itemElementsRef.current.set(id, element);
    } else {
      itemElementsRef.current.delete(id);
    }
  }

  useLayoutEffect(() => {
    const currentPositions = new Map<string, ItemPosition>();
    const moving: { element: HTMLElement; x: number; y: number }[] = [];

    records.forEach((record) => {
      const element = itemElementsRef.current.get(record.id);

      if (!element) {
        return;
      }

      const currentPosition = getDocumentPosition(element);
      const previousPosition = positionsRef.current.get(record.id);
      currentPositions.set(record.id, currentPosition);

      if (record.state === "present" && previousPosition) {
        const x = previousPosition.left - currentPosition.left;
        const y = previousPosition.top - currentPosition.top;
        const content = element.querySelector<HTMLElement>("[data-easecraft-toast-content]");

        if (content && (x !== 0 || y !== 0)) {
          moving.push({ element: content, x, y });
        }
      }
    });

    positionsRef.current = currentPositions;

    if (moving.length === 0 || reducedMotion) {
      return undefined;
    }

    const root = moving[0]?.element;

    if (!root) {
      return undefined;
    }

    const scope = createScope({ root });
    const resolvedDuration = resolveDuration(reflowDuration, tokens.duration);
    const resolvedEasing = resolveEasing(reflowEasing, tokens.easing);

    scope.add(() => {
      moving.forEach(({ element, x, y }) => {
        animate(element, {
          duration: resolvedDuration,
          ease: resolvedEasing,
          x: [x, 0],
          y: [y, 0],
        });
      });
    });

    return () => {
      scope.revert();
    };
  }, [records, reducedMotion, reflowDuration, reflowEasing, tokens]);

  return (
    <Toast.Provider
      duration={duration}
      label={label}
      swipeDirection={swipeDirection}
      swipeThreshold={swipeThreshold}
      {...(announcerContainer ? { announcerContainer } : {})}
    >
      {records.map((record) => (
        <ToastMotionLayer
          actionClassName={actionClassName}
          closeClassName={closeClassName}
          closeLabel={closeLabel}
          contentClassName={contentClassName}
          contentStyle={contentStyle}
          distance={distance}
          duration={entryDuration}
          easing={easing}
          exitDuration={exitDuration}
          exitEasing={exitEasing}
          item={record.item}
          key={record.id}
          onComplete={completeMotion}
          onDismiss={requestDismiss}
          onPauseChange={onPauseChange}
          registerElement={registerElement}
          state={record.state}
          toastClassName={toastClassName}
          toastStyle={toastStyle}
        />
      ))}
      <Toast.Viewport
        className={viewportClassName}
        data-easecraft-toast-viewport=""
        hotkey={hotkey}
        label={viewportLabel}
        style={{ ...defaultViewportStyle, ...viewportStyle }}
      />
    </Toast.Provider>
  );
}
