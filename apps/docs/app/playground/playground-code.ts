import { getInstallCommand, getInstallPlan } from "easecraft-registry";

import type { PlaygroundState } from "./playground-state";

function reducedMotionMode(state: PlaygroundState): "always" | "never" {
  return state.reducedMotion ? "always" : "never";
}

function generateTextRevealCode(state: Extract<PlaygroundState, { component: "text-reveal" }>) {
  return `import { MotionProvider, TextReveal } from "easecraft";

export function Example() {
  return (
    <MotionProvider reducedMotion="${reducedMotionMode(state)}">
      <TextReveal
        delay={${state.delay.toString()}}
        distance={${state.distance.toString()}}
        duration={${state.duration.toString()}}
        easing="${state.easing}"
        preset="${state.preset}"
        split="${state.split}"
        stagger={${state.stagger.toString()}}
      >
        Motion should explain what changed.
      </TextReveal>
    </MotionProvider>
  );
}
`;
}

function generateStaggeredListCode(
  state: Extract<PlaygroundState, { component: "staggered-list" }>,
) {
  return `import { MotionProvider, StaggeredList } from "easecraft";

const items = [
  { id: "brief", label: "Write the brief" },
  { id: "prototype", label: "Prototype the motion" },
  { id: "verify", label: "Verify accessibility" },
] as const;

export function Example() {
  return (
    <MotionProvider reducedMotion="${reducedMotionMode(state)}">
      <StaggeredList
        delay={${state.delay.toString()}}
        distance={${state.distance.toString()}}
        duration={${state.duration.toString()}}
        easing="${state.easing}"
        getKey={(item) => item.id}
        interval={${state.stagger.toString()}}
        items={items}
        order="${state.order}"
        preset="${state.preset}"
      >
        {(item) => <span>{item.label}</span>}
      </StaggeredList>
    </MotionProvider>
  );
}
`;
}

function generateMotionDialogCode(state: Extract<PlaygroundState, { component: "motion-dialog" }>) {
  return `import { MotionDialog, MotionProvider } from "easecraft";

export function Example() {
  return (
    <MotionProvider reducedMotion="${reducedMotionMode(state)}">
      <MotionDialog
        dismissible={${state.dismissible.toString()}}
        distance={${state.distance.toString()}}
        duration={${state.duration.toString()}}
        easing="${state.easing}"
        title="Motion review"
        trigger={<button type="button">Open review</button>}
      >
        <p>Review the motion before publishing.</p>
      </MotionDialog>
    </MotionProvider>
  );
}
`;
}

export function generatePlaygroundCode(state: PlaygroundState): string {
  if (state.component === "staggered-list") {
    return generateStaggeredListCode(state);
  }

  if (state.component === "motion-dialog") {
    return generateMotionDialogCode(state);
  }

  return generateTextRevealCode(state);
}

export function getPlaygroundInstallCommand(state: PlaygroundState): string {
  return getInstallCommand(getInstallPlan(state.component, "package"));
}
