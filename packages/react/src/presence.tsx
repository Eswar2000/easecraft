import { useCallback, useEffect, useReducer, useRef, type ReactNode } from "react";

import { useReducedMotion } from "./motion-provider.js";

export type PresenceState = "entering" | "present" | "exiting";

export interface PresenceRenderProps {
  readonly complete: () => void;
  readonly state: PresenceState;
}

export interface PresenceProps {
  readonly children: (props: PresenceRenderProps) => ReactNode;
  readonly onEnterComplete?: () => void;
  readonly onExitComplete?: () => void;
  readonly present: boolean;
}

type InternalPresenceState = PresenceState | "unmounted";
type CompletedTransition = Extract<PresenceState, "entering" | "exiting">;

interface PresenceMachine {
  readonly completed: { readonly id: number; readonly state: CompletedTransition } | null;
  readonly state: InternalPresenceState;
  readonly transitionId: number;
}

type PresenceAction =
  | { readonly present: boolean; readonly type: "sync" }
  | { readonly transitionId: number; readonly type: "complete" };

function createInitialMachine(present: boolean): PresenceMachine {
  return {
    completed: null,
    state: present ? "entering" : "unmounted",
    transitionId: present ? 1 : 0,
  };
}

function syncPresence(machine: PresenceMachine, present: boolean): PresenceMachine {
  if (present && (machine.state === "unmounted" || machine.state === "exiting")) {
    return {
      completed: null,
      state: "entering",
      transitionId: machine.transitionId + 1,
    };
  }

  if (!present && (machine.state === "entering" || machine.state === "present")) {
    return {
      completed: null,
      state: "exiting",
      transitionId: machine.transitionId + 1,
    };
  }

  return machine;
}

function completePresence(machine: PresenceMachine, transitionId: number): PresenceMachine {
  if (machine.transitionId !== transitionId) {
    return machine;
  }

  if (machine.state === "entering") {
    return {
      ...machine,
      completed: { id: transitionId, state: "entering" },
      state: "present",
    };
  }

  if (machine.state === "exiting") {
    return {
      ...machine,
      completed: { id: transitionId, state: "exiting" },
      state: "unmounted",
    };
  }

  return machine;
}

function presenceReducer(machine: PresenceMachine, action: PresenceAction): PresenceMachine {
  return action.type === "sync"
    ? syncPresence(machine, action.present)
    : completePresence(machine, action.transitionId);
}

export function Presence({ children, onEnterComplete, onExitComplete, present }: PresenceProps) {
  const reducedMotion = useReducedMotion();
  const [machine, dispatch] = useReducer(presenceReducer, present, createInitialMachine);
  const notifiedTransitionRef = useRef(0);
  const complete = useCallback(() => {
    dispatch({ transitionId: machine.transitionId, type: "complete" });
  }, [machine.transitionId]);

  useEffect(() => {
    dispatch({ present, type: "sync" });
  }, [present]);

  useEffect(() => {
    if (reducedMotion && (machine.state === "entering" || machine.state === "exiting")) {
      complete();
    }
  }, [complete, machine.state, reducedMotion]);

  useEffect(() => {
    const completed = machine.completed;

    if (!completed || notifiedTransitionRef.current === completed.id) {
      return;
    }

    notifiedTransitionRef.current = completed.id;

    if (completed.state === "entering") {
      onEnterComplete?.();
    } else {
      onExitComplete?.();
    }
  }, [machine.completed, onEnterComplete, onExitComplete]);

  if (machine.state === "unmounted") {
    return null;
  }

  return children({ complete, state: machine.state });
}
