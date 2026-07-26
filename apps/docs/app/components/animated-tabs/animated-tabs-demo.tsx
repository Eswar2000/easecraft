"use client";

import {
  AnimatedTabs,
  MotionProvider,
  type AnimatedTabsActivationMode,
  type AnimatedTabsOrientation,
} from "easecraft";
import { useState } from "react";

interface WorkspaceView {
  readonly disabled?: boolean;
  readonly id: "overview" | "activity" | "permissions" | "metrics";
  readonly label: string;
  readonly metric: string;
  readonly note: string;
}

const workspaceViews = [
  {
    id: "overview",
    label: "Overview",
    metric: "24",
    note: "Active motion components",
  },
  {
    id: "activity",
    label: "Activity",
    metric: "08",
    note: "Changes this week",
  },
  {
    disabled: true,
    id: "permissions",
    label: "Permissions",
    metric: "--",
    note: "Unavailable in preview",
  },
  {
    id: "metrics",
    label: "Metrics",
    metric: "98",
    note: "Accessibility score",
  },
] satisfies readonly WorkspaceView[];

function getWorkspaceViewLabel(view: WorkspaceView) {
  return view.label;
}

function getWorkspaceViewValue(view: WorkspaceView) {
  return view.id;
}

function isWorkspaceViewDisabled(view: WorkspaceView) {
  return view.disabled ?? false;
}

export function AnimatedTabsDemo() {
  const [activationMode, setActivationMode] = useState<AnimatedTabsActivationMode>("automatic");
  const [orientation, setOrientation] = useState<AnimatedTabsOrientation>("horizontal");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [value, setValue] = useState<WorkspaceView["id"]>("overview");

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="tabs-demo" aria-label="Animated Tabs interactive preview">
        <div className="tabs-demo-controls">
          <fieldset className="tabs-control-group">
            <legend>Activation</legend>
            {(["automatic", "manual"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={activationMode === mode}
                onClick={() => {
                  setActivationMode(mode);
                }}
              >
                {mode}
              </button>
            ))}
          </fieldset>
          <fieldset className="tabs-control-group">
            <legend>Orientation</legend>
            {(["horizontal", "vertical"] as const).map((nextOrientation) => (
              <button
                key={nextOrientation}
                type="button"
                aria-pressed={orientation === nextOrientation}
                onClick={() => {
                  setOrientation(nextOrientation);
                }}
              >
                {nextOrientation}
              </button>
            ))}
          </fieldset>
          <label className="motion-switch">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => {
                setReducedMotion(event.currentTarget.checked);
              }}
            />
            <span aria-hidden="true" />
            Reduce motion
          </label>
        </div>
        <div className="tabs-demo-stage">
          <span className="stage-label">Workspace views / controlled</span>
          <AnimatedTabs
            aria-label="Workspace views"
            activationMode={activationMode}
            className="animated-tabs-demo"
            duration="normal"
            getLabel={getWorkspaceViewLabel}
            getValue={getWorkspaceViewValue}
            isDisabled={isWorkspaceViewDisabled}
            items={workspaceViews}
            onValueChange={setValue}
            orientation={orientation}
            value={value}
          >
            {(view) => (
              <div className="tabs-demo-panel-content">
                <div>
                  <span className="tabs-panel-kicker">Selected / {view.label}</span>
                  <strong>{view.metric}</strong>
                  <p>{view.note}</p>
                </div>
                <dl>
                  <div>
                    <dt>Lifecycle</dt>
                    <dd>Scoped</dd>
                  </div>
                  <div>
                    <dt>Keyboard</dt>
                    <dd>Ready</dd>
                  </div>
                  <div>
                    <dt>Motion</dt>
                    <dd>{reducedMotion ? "Reduced" : "Enabled"}</dd>
                  </div>
                </dl>
              </div>
            )}
          </AnimatedTabs>
        </div>
      </section>
    </MotionProvider>
  );
}
