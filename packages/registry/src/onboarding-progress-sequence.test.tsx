// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { OnboardingProgressSequence } from "../source/compositions/onboarding-progress-sequence.package.js";

const steps = [
  { content: <p>Tell us who you are.</p>, id: "profile", label: "Profile" },
  { content: <p>Choose your workspace.</p>, id: "workspace", label: "Workspace" },
  { content: <p>Invite your collaborators.</p>, id: "team", label: "Team", optional: true },
] as const;

afterEach(() => {
  cleanup();
});

describe("OnboardingProgressSequence", () => {
  it("renders linked progress tabs, a polite step status, and navigation controls", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <OnboardingProgressSequence steps={steps} />
      </MotionProvider>,
    );

    expect(view.getByRole("tablist", { name: "Onboarding progress" })).toBeTruthy();
    expect(view.getAllByRole("tab")).toHaveLength(3);
    expect(view.getByRole("tab", { name: /Profile/ }).getAttribute("aria-selected")).toBe("true");
    expect(view.getByText("Step 1 of 3: Profile").getAttribute("aria-live")).toBe("polite");
    expect(view.getByRole("tabpanel").textContent).toContain("Tell us who you are.");
    expect(view.getByRole("button", { name: "Back" }).hasAttribute("disabled")).toBe(true);
    expect(view.getByText("Optional")).toBeTruthy();
  });

  it("moves forward and back while reporting each selected step", () => {
    const onStepChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <OnboardingProgressSequence onStepChange={onStepChange} steps={steps} />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Continue" }));
    expect(onStepChange).toHaveBeenLastCalledWith("workspace");
    expect(view.getByText("Step 2 of 3: Workspace")).toBeTruthy();
    expect(view.getByRole("tab", { name: /Profile/ }).textContent).toContain("complete");

    fireEvent.click(view.getByRole("button", { name: "Back" }));
    expect(onStepChange).toHaveBeenLastCalledWith("profile");
    expect(view.getByText("Step 1 of 3: Profile")).toBeTruthy();
  });

  it("skips disabled steps and completes from the final enabled step", () => {
    const onComplete = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <OnboardingProgressSequence
          onComplete={onComplete}
          steps={[steps[0], { ...steps[1], disabled: true }, steps[2]]}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Continue" }));
    expect(view.getByText("Step 3 of 3: Team")).toBeTruthy();
    expect(view.getByRole("tab", { name: /Workspace/ }).getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(view.getByRole("button", { name: "Finish" }));
    expect(onComplete).toHaveBeenCalledWith(steps[2]);
  });

  it("reports controlled changes without changing the active step", () => {
    const onStepChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <OnboardingProgressSequence
          currentStep="workspace"
          onStepChange={onStepChange}
          steps={steps}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Continue" }));

    expect(onStepChange).toHaveBeenCalledWith("team");
    expect(view.getByText("Step 2 of 3: Workspace")).toBeTruthy();
    expect(view.getByRole("tab", { name: /Workspace/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("supports direct tab selection with manual keyboard activation", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <OnboardingProgressSequence steps={steps} />
      </MotionProvider>,
    );
    const profileTab = view.getByRole("tab", { name: /Profile/ });

    fireEvent.keyDown(profileTab, { key: "ArrowRight" });
    expect(document.activeElement).toBe(view.getByRole("tab", { name: /Workspace/ }));
    expect(profileTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(view.getByRole("tab", { name: /Workspace/ }), { key: "Enter" });
    expect(view.getByText("Step 2 of 3: Workspace")).toBeTruthy();
  });

  it("rejects empty, duplicate, unknown, disabled, and fully disabled step states", () => {
    expect(() => render(<OnboardingProgressSequence steps={[]} />)).toThrow(
      "OnboardingProgressSequence requires at least one step.",
    );
    expect(() => render(<OnboardingProgressSequence steps={[steps[0], steps[0]]} />)).toThrow(
      "OnboardingProgressSequence received a duplicate step id: profile",
    );
    expect(() =>
      render(<OnboardingProgressSequence currentStep="missing" steps={steps} />),
    ).toThrow("OnboardingProgressSequence currentStep references an unknown step: missing");
    expect(() =>
      render(
        <OnboardingProgressSequence
          defaultStep="workspace"
          steps={[steps[0], { ...steps[1], disabled: true }]}
        />,
      ),
    ).toThrow("OnboardingProgressSequence defaultStep references a disabled step: workspace");
    expect(() =>
      render(<OnboardingProgressSequence steps={[{ ...steps[0], disabled: true }]} />),
    ).toThrow("OnboardingProgressSequence requires at least one enabled step.");
  });
});
