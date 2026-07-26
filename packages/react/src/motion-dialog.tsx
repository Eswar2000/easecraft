import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import type { DistanceTokens, DurationTokens, EasingTokens } from "easecraft-tokens";

import { useMotionConfig } from "./motion-provider.js";

export type MotionDialogState = "entering" | "open" | "exiting";
export type MotionDialogDuration = keyof DurationTokens | number;
export type MotionDialogDistance = keyof DistanceTokens | number;
export type MotionDialogEasing = keyof EasingTokens | (string & Record<never, never>);

export interface MotionDialogProps {
  readonly children: ReactNode;
  readonly closeClassName?: string;
  readonly closeLabel?: string;
  readonly contentClassName?: string;
  readonly contentStyle?: CSSProperties;
  readonly defaultOpen?: boolean;
  readonly description?: ReactNode;
  readonly dismissible?: boolean;
  readonly distance?: MotionDialogDistance;
  readonly duration?: MotionDialogDuration;
  readonly easing?: MotionDialogEasing;
  readonly exitDuration?: MotionDialogDuration;
  readonly exitEasing?: MotionDialogEasing;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly onAfterClose?: () => void;
  readonly onAfterOpen?: () => void;
  readonly onOpenChange?: (open: boolean) => void;
  readonly open?: boolean;
  readonly overlayClassName?: string;
  readonly overlayStyle?: CSSProperties;
  readonly portalClassName?: string;
  readonly portalContainer?: HTMLElement | null;
  readonly positionerClassName?: string;
  readonly positionerStyle?: CSSProperties;
  readonly title: ReactNode;
  readonly trigger: ReactElement;
}

type InternalDialogState = MotionDialogState | "closed";
type CompletedDialogState = Extract<MotionDialogState, "entering" | "exiting">;

interface DialogMachine {
  readonly completed: { readonly id: number; readonly state: CompletedDialogState } | null;
  readonly state: InternalDialogState;
  readonly transitionId: number;
}

type DialogAction =
  | { readonly open: boolean; readonly type: "sync" }
  | { readonly transitionId: number; readonly type: "complete" };

interface MotionStyleSnapshot {
  readonly opacity: string;
  readonly rotate: string;
  readonly scale: string;
  readonly transform: string;
  readonly translate: string;
}

interface MotionDialogLayerProps {
  readonly children: ReactNode;
  readonly closeClassName: string | undefined;
  readonly closeLabel: string;
  readonly contentClassName: string | undefined;
  readonly contentStyle: CSSProperties | undefined;
  readonly description: ReactNode | undefined;
  readonly dismissible: boolean;
  readonly distance: MotionDialogDistance;
  readonly dispatch: Dispatch<DialogAction>;
  readonly duration: MotionDialogDuration;
  readonly easing: MotionDialogEasing;
  readonly exitDuration: MotionDialogDuration;
  readonly exitEasing: MotionDialogEasing;
  readonly initialFocusRef: RefObject<HTMLElement | null> | undefined;
  readonly overlayClassName: string | undefined;
  readonly overlayStyle: CSSProperties | undefined;
  readonly phase: MotionDialogState;
  readonly portalClassName: string | undefined;
  readonly positionerClassName: string | undefined;
  readonly positionerStyle: CSSProperties | undefined;
  readonly title: ReactNode;
  readonly transitionId: number;
}

const defaultOverlayStyle: CSSProperties = {
  background: "var(--easecraft-dialog-overlay, rgb(0 0 0 / 0.52))",
  inset: 0,
  position: "fixed",
  zIndex: 50,
};

const defaultPositionerStyle: CSSProperties = {
  display: "grid",
  inset: 0,
  padding: 16,
  placeItems: "center",
  pointerEvents: "none",
  position: "fixed",
  zIndex: 51,
};

const defaultContentStyle: CSSProperties = {
  background: "var(--easecraft-dialog-background, Canvas)",
  borderRadius: "var(--easecraft-dialog-radius, 6px)",
  color: "var(--easecraft-dialog-foreground, CanvasText)",
  maxHeight: "calc(100vh - 32px)",
  maxWidth: "32rem",
  overflow: "auto",
  padding: "var(--easecraft-dialog-padding, 24px)",
  pointerEvents: "auto",
  width: "100%",
};

function createInitialMachine(open: boolean): DialogMachine {
  return {
    completed: null,
    state: open ? "entering" : "closed",
    transitionId: open ? 1 : 0,
  };
}

function syncDialog(machine: DialogMachine, open: boolean): DialogMachine {
  if (open && (machine.state === "closed" || machine.state === "exiting")) {
    return {
      completed: null,
      state: "entering",
      transitionId: machine.transitionId + 1,
    };
  }

  if (!open && (machine.state === "entering" || machine.state === "open")) {
    return {
      completed: null,
      state: "exiting",
      transitionId: machine.transitionId + 1,
    };
  }

  return machine;
}

function completeDialog(machine: DialogMachine, transitionId: number): DialogMachine {
  if (machine.transitionId !== transitionId) {
    return machine;
  }

  if (machine.state === "entering") {
    return {
      ...machine,
      completed: { id: transitionId, state: "entering" },
      state: "open",
    };
  }

  if (machine.state === "exiting") {
    return {
      ...machine,
      completed: { id: transitionId, state: "exiting" },
      state: "closed",
    };
  }

  return machine;
}

function dialogReducer(machine: DialogMachine, action: DialogAction): DialogMachine {
  return action.type === "sync"
    ? syncDialog(machine, action.open)
    : completeDialog(machine, action.transitionId);
}

function resolveDuration(duration: MotionDialogDuration, tokens: DurationTokens): number {
  return typeof duration === "number" ? duration : tokens[duration];
}

function resolveDistance(distance: MotionDialogDistance, tokens: DistanceTokens): number {
  return typeof distance === "number" ? distance : tokens[distance];
}

function resolveEasing(easing: MotionDialogEasing, tokens: EasingTokens): string {
  return Object.hasOwn(tokens, easing) ? tokens[easing as keyof EasingTokens] : easing;
}

function getMotionStyle(element: HTMLElement): MotionStyleSnapshot {
  return {
    opacity: element.style.opacity,
    rotate: element.style.rotate,
    scale: element.style.scale,
    transform: element.style.transform,
    translate: element.style.translate,
  };
}

function applyMotionStyle(element: HTMLElement, snapshot: MotionStyleSnapshot) {
  element.style.opacity = snapshot.opacity;
  element.style.rotate = snapshot.rotate;
  element.style.scale = snapshot.scale;
  element.style.transform = snapshot.transform;
  element.style.translate = snapshot.translate;
}

function MotionDialogLayer({
  children,
  closeClassName,
  closeLabel,
  contentClassName,
  contentStyle,
  description,
  dismissible,
  distance,
  dispatch,
  duration,
  easing,
  exitDuration,
  exitEasing,
  initialFocusRef,
  overlayClassName,
  overlayStyle,
  phase,
  portalClassName,
  positionerClassName,
  positionerStyle,
  title,
  transitionId,
}: MotionDialogLayerProps) {
  const { reducedMotion, tokens } = useMotionConfig();
  const portalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const baseStylesRef = useRef(new WeakMap<HTMLElement, MotionStyleSnapshot>());

  useLayoutEffect(() => {
    const root = portalRef.current;
    const overlay = overlayRef.current;
    const content = contentRef.current;

    if (!root || !overlay || !content) {
      return undefined;
    }

    const emptyMotionStyle: MotionStyleSnapshot = {
      opacity: "",
      rotate: "",
      scale: "",
      transform: "",
      translate: "",
    };

    if (phase === "open") {
      applyMotionStyle(overlay, baseStylesRef.current.get(overlay) ?? emptyMotionStyle);
      applyMotionStyle(content, baseStylesRef.current.get(content) ?? emptyMotionStyle);
      return undefined;
    }

    if (!baseStylesRef.current.has(overlay)) {
      baseStylesRef.current.set(overlay, getMotionStyle(overlay));
    }

    if (!baseStylesRef.current.has(content)) {
      baseStylesRef.current.set(content, getMotionStyle(content));
    }

    const complete = () => {
      completed = true;
      dispatch({ transitionId, type: "complete" });
    };
    let completed = false;

    if (reducedMotion) {
      applyMotionStyle(overlay, baseStylesRef.current.get(overlay) ?? emptyMotionStyle);
      applyMotionStyle(content, baseStylesRef.current.get(content) ?? emptyMotionStyle);
      complete();
      return undefined;
    }

    const scope = createScope({ root });
    const resolvedDistance = resolveDistance(distance, tokens.distance);
    const entering = phase === "entering";
    const interrupted = content.style.opacity.length > 0 || content.style.transform.length > 0;
    const resolvedDuration = resolveDuration(entering ? duration : exitDuration, tokens.duration);
    const resolvedEasing = resolveEasing(entering ? easing : exitEasing, tokens.easing);

    scope.add(() => {
      animate(overlay, {
        duration: resolvedDuration,
        ease: resolvedEasing,
        opacity: entering ? (interrupted ? 1 : [0, 1]) : 0,
      });
      animate(content, {
        duration: resolvedDuration,
        ease: resolvedEasing,
        onComplete: complete,
        opacity: entering ? (interrupted ? 1 : [0, 1]) : 0,
        scale: entering ? (interrupted ? 1 : [0.98, 1]) : 0.98,
        y: entering ? (interrupted ? 0 : [resolvedDistance, 0]) : -resolvedDistance,
      });
    });

    return () => {
      const overlaySnapshot = getMotionStyle(overlay);
      const contentSnapshot = getMotionStyle(content);
      scope.revert();

      if (!completed) {
        applyMotionStyle(overlay, overlaySnapshot);
        applyMotionStyle(content, contentSnapshot);

        queueMicrotask(() => {
          if (!overlay.isConnected) {
            applyMotionStyle(overlay, baseStylesRef.current.get(overlay) ?? emptyMotionStyle);
          }

          if (!content.isConnected) {
            applyMotionStyle(content, baseStylesRef.current.get(content) ?? emptyMotionStyle);
          }
        });
      }
    };
  }, [
    dispatch,
    distance,
    duration,
    easing,
    exitDuration,
    exitEasing,
    phase,
    reducedMotion,
    tokens,
    transitionId,
  ]);

  return (
    <div className={portalClassName} data-easecraft-dialog-portal="" ref={portalRef}>
      <Dialog.Overlay
        className={overlayClassName}
        data-easecraft-dialog-overlay=""
        data-easecraft-state={phase}
        ref={overlayRef}
        style={{ ...defaultOverlayStyle, ...overlayStyle }}
      />
      <div
        className={positionerClassName}
        data-easecraft-dialog-positioner=""
        style={{ ...defaultPositionerStyle, ...positionerStyle }}
      >
        <Dialog.Content
          className={contentClassName}
          data-easecraft-dialog-content=""
          data-easecraft-state={phase}
          onEscapeKeyDown={(event) => {
            if (!dismissible) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (!dismissible) {
              event.preventDefault();
            }
          }}
          onOpenAutoFocus={(event) => {
            const initialFocus = initialFocusRef?.current;

            if (initialFocus) {
              event.preventDefault();
              initialFocus.focus({ preventScroll: true });
            }
          }}
          ref={contentRef}
          style={{ ...defaultContentStyle, ...contentStyle }}
        >
          <Dialog.Title data-easecraft-dialog-title="">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description data-easecraft-dialog-description="">
              {description}
            </Dialog.Description>
          ) : null}
          <div data-easecraft-dialog-body="">{children}</div>
          <Dialog.Close
            aria-label={closeLabel}
            className={closeClassName}
            data-easecraft-dialog-close=""
            type="button"
          >
            {closeLabel}
          </Dialog.Close>
        </Dialog.Content>
      </div>
    </div>
  );
}

export function MotionDialog({
  children,
  closeClassName,
  closeLabel = "Close",
  contentClassName,
  contentStyle,
  defaultOpen = false,
  description,
  dismissible = true,
  distance = "medium",
  duration = "normal",
  easing = "enter",
  exitDuration = "fast",
  exitEasing = "exit",
  initialFocusRef,
  onAfterClose,
  onAfterOpen,
  onOpenChange,
  open: controlledOpen,
  overlayClassName,
  overlayStyle,
  portalClassName,
  portalContainer,
  positionerClassName,
  positionerStyle,
  title,
  trigger,
}: MotionDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const requestedOpen = controlledOpen ?? uncontrolledOpen;
  const [machine, dispatch] = useReducer(dialogReducer, requestedOpen, createInitialMachine);
  const notifiedTransitionRef = useRef(0);

  useEffect(() => {
    dispatch({ open: requestedOpen, type: "sync" });
  }, [requestedOpen]);

  useEffect(() => {
    const completed = machine.completed;

    if (!completed || notifiedTransitionRef.current === completed.id) {
      return;
    }

    notifiedTransitionRef.current = completed.id;

    if (completed.state === "entering") {
      onAfterOpen?.();
    } else {
      onAfterClose?.();
    }
  }, [machine.completed, onAfterClose, onAfterOpen]);

  function requestOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  }

  const renderedOpen = machine.state !== "closed";

  return (
    <Dialog.Root onOpenChange={requestOpen} open={renderedOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      {renderedOpen ? (
        <Dialog.Portal container={portalContainer}>
          <MotionDialogLayer
            closeClassName={closeClassName}
            closeLabel={closeLabel}
            contentClassName={contentClassName}
            contentStyle={contentStyle}
            description={description}
            dismissible={dismissible}
            dispatch={dispatch}
            distance={distance}
            duration={duration}
            easing={easing}
            exitDuration={exitDuration}
            exitEasing={exitEasing}
            initialFocusRef={initialFocusRef}
            overlayClassName={overlayClassName}
            overlayStyle={overlayStyle}
            phase={machine.state as MotionDialogState}
            portalClassName={portalClassName}
            positionerClassName={positionerClassName}
            positionerStyle={positionerStyle}
            title={title}
            transitionId={machine.transitionId}
          >
            {children}
          </MotionDialogLayer>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  );
}
