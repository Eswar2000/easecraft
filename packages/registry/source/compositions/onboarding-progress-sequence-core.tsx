import { useState, type ComponentType, type ReactNode } from "react";

export type OnboardingStepStatus = "complete" | "current" | "upcoming";
export type OnboardingSequenceActivationMode = "automatic" | "manual";
export type OnboardingSequenceOrientation = "horizontal" | "vertical";

export interface OnboardingStep {
  readonly complete?: boolean;
  readonly content: ReactNode;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
  readonly id: string;
  readonly label: ReactNode;
  readonly optional?: boolean;
}

export interface OnboardingTabsAdapterProps {
  readonly activationMode: OnboardingSequenceActivationMode;
  readonly ariaLabel: string;
  readonly children: (step: OnboardingStep) => ReactNode;
  readonly className?: string;
  readonly getLabel: (step: OnboardingStep) => ReactNode;
  readonly getValue: (step: OnboardingStep) => string;
  readonly isDisabled: (step: OnboardingStep) => boolean;
  readonly items: readonly OnboardingStep[];
  readonly onValueChange: (value: string) => void;
  readonly orientation: OnboardingSequenceOrientation;
  readonly status: ReactNode;
  readonly statusClassName?: string;
  readonly value: string;
}

export interface OnboardingProgressSequenceProps {
  readonly activationMode?: OnboardingSequenceActivationMode;
  readonly actionsClassName?: string;
  readonly ariaLabel?: string;
  readonly backButtonClassName?: string;
  readonly backLabel?: ReactNode;
  readonly className?: string;
  readonly completeLabel?: ReactNode;
  readonly continueButtonClassName?: string;
  readonly continueLabel?: ReactNode;
  readonly currentStep?: string;
  readonly defaultStep?: string;
  readonly onComplete?: (step: OnboardingStep) => void;
  readonly onStepChange?: (stepId: string) => void;
  readonly optionalLabel?: ReactNode;
  readonly orientation?: OnboardingSequenceOrientation;
  readonly panelClassName?: string;
  readonly statusClassName?: string;
  readonly stepLabelClassName?: string;
  readonly steps: readonly OnboardingStep[];
}

function validateSteps(
  steps: readonly OnboardingStep[],
  currentStep: string | undefined,
  defaultStep: string | undefined,
): OnboardingStep {
  if (steps.length === 0) {
    throw new Error("OnboardingProgressSequence requires at least one step.");
  }

  const stepIds = new Set<string>();
  steps.forEach((step) => {
    if (stepIds.has(step.id)) {
      throw new Error(`OnboardingProgressSequence received a duplicate step id: ${step.id}`);
    }

    stepIds.add(step.id);
  });

  const firstEnabledStep = steps.find((step) => !step.disabled);

  if (!firstEnabledStep) {
    throw new Error("OnboardingProgressSequence requires at least one enabled step.");
  }

  for (const [name, value] of [
    ["currentStep", currentStep],
    ["defaultStep", defaultStep],
  ] as const) {
    if (value !== undefined && !stepIds.has(value)) {
      throw new Error(`OnboardingProgressSequence ${name} references an unknown step: ${value}`);
    }

    if (value !== undefined && steps.find((step) => step.id === value)?.disabled) {
      throw new Error(`OnboardingProgressSequence ${name} references a disabled step: ${value}`);
    }
  }

  return firstEnabledStep;
}

function getStepValue(step: OnboardingStep) {
  return step.id;
}

function isStepDisabled(step: OnboardingStep) {
  return step.disabled ?? false;
}

export function createOnboardingProgressSequence(
  OnboardingTabs: ComponentType<OnboardingTabsAdapterProps>,
) {
  function OnboardingProgressSequence(props: OnboardingProgressSequenceProps) {
    const {
      activationMode = "manual",
      actionsClassName,
      ariaLabel = "Onboarding progress",
      backButtonClassName,
      backLabel = "Back",
      className,
      completeLabel = "Finish",
      continueButtonClassName,
      continueLabel = "Continue",
      currentStep,
      defaultStep,
      onComplete,
      onStepChange,
      optionalLabel = "Optional",
      orientation = "horizontal",
      panelClassName,
      statusClassName,
      stepLabelClassName,
      steps,
    } = props;
    const firstEnabledStep = validateSteps(steps, currentStep, defaultStep);
    const [uncontrolledStep, setUncontrolledStep] = useState(
      () => defaultStep ?? firstEnabledStep.id,
    );
    const requestedStep = currentStep ?? uncontrolledStep;
    const activeStep =
      steps.find((step) => step.id === requestedStep && !step.disabled) ?? firstEnabledStep;
    const activeIndex = steps.indexOf(activeStep);
    const previousStep = steps
      .slice(0, activeIndex)
      .reverse()
      .find((step) => !step.disabled);
    const nextStep = steps.slice(activeIndex + 1).find((step) => !step.disabled);

    function selectStep(stepId: string) {
      if (stepId === activeStep.id) {
        return;
      }

      if (currentStep === undefined) {
        setUncontrolledStep(stepId);
      }

      onStepChange?.(stepId);
    }

    function getStepStatus(step: OnboardingStep): OnboardingStepStatus {
      const stepIndex = steps.indexOf(step);

      if (step.id === activeStep.id) {
        return "current";
      }

      return step.complete || stepIndex < activeIndex ? "complete" : "upcoming";
    }

    function getStepLabel(step: OnboardingStep) {
      const stepIndex = steps.indexOf(step);
      const status = getStepStatus(step);

      return (
        <span
          className={stepLabelClassName}
          data-easecraft-onboarding-step-label=""
          data-state={status}
        >
          <span aria-hidden="true" data-easecraft-onboarding-step-number="">
            {(stepIndex + 1).toString().padStart(2, "0")}
          </span>
          <span data-easecraft-onboarding-step-copy="">
            <span data-easecraft-onboarding-step-title="">{step.label}</span>
            {step.description ? (
              <span data-easecraft-onboarding-step-description="">{step.description}</span>
            ) : null}
          </span>
          <span data-easecraft-onboarding-step-state="">{status}</span>
          {step.optional ? (
            <span data-easecraft-onboarding-step-optional="">{optionalLabel}</span>
          ) : null}
        </span>
      );
    }

    function renderStep(step: OnboardingStep) {
      return (
        <div className={panelClassName} data-easecraft-onboarding-panel="">
          <div data-easecraft-onboarding-content="">{step.content}</div>
          <div className={actionsClassName} data-easecraft-onboarding-actions="">
            <button
              className={backButtonClassName}
              disabled={!previousStep}
              onClick={() => {
                if (previousStep) {
                  selectStep(previousStep.id);
                }
              }}
              type="button"
            >
              {backLabel}
            </button>
            <button
              className={continueButtonClassName}
              onClick={() => {
                if (nextStep) {
                  selectStep(nextStep.id);
                } else {
                  onComplete?.(activeStep);
                }
              }}
              type="button"
            >
              {nextStep ? continueLabel : completeLabel}
            </button>
          </div>
        </div>
      );
    }

    return (
      <OnboardingTabs
        activationMode={activationMode}
        ariaLabel={ariaLabel}
        {...(className ? { className } : {})}
        getLabel={getStepLabel}
        getValue={getStepValue}
        isDisabled={isStepDisabled}
        items={steps}
        onValueChange={selectStep}
        orientation={orientation}
        status={
          <>
            Step {(activeIndex + 1).toString()} of {steps.length.toString()}: {activeStep.label}
          </>
        }
        {...(statusClassName ? { statusClassName } : {})}
        value={activeStep.id}
      >
        {renderStep}
      </OnboardingTabs>
    );
  }

  OnboardingProgressSequence.displayName = "OnboardingProgressSequence";
  return OnboardingProgressSequence;
}
