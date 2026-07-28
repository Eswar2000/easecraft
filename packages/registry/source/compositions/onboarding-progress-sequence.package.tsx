import { AnimatedTabs } from "easecraft";

import {
  createOnboardingProgressSequence,
  type OnboardingStep,
  type OnboardingTabsAdapterProps,
} from "./onboarding-progress-sequence-core.js";

function OnboardingTabs(props: OnboardingTabsAdapterProps) {
  const {
    activationMode,
    ariaLabel,
    children,
    className,
    getLabel,
    getValue,
    isDisabled,
    items,
    onValueChange,
    orientation,
    status,
    statusClassName,
    value,
  } = props;

  return (
    <div className={className} data-easecraft-onboarding-sequence="">
      <p
        aria-atomic="true"
        aria-live="polite"
        className={statusClassName}
        data-easecraft-onboarding-status=""
      >
        {status}
      </p>
      <AnimatedTabs<OnboardingStep>
        activationMode={activationMode}
        aria-label={ariaLabel}
        getLabel={getLabel}
        getValue={getValue}
        isDisabled={isDisabled}
        items={items}
        onValueChange={onValueChange}
        orientation={orientation}
        value={value}
      >
        {children}
      </AnimatedTabs>
    </div>
  );
}

export const OnboardingProgressSequence = createOnboardingProgressSequence(OnboardingTabs);

export type {
  OnboardingProgressSequenceProps,
  OnboardingSequenceActivationMode,
  OnboardingSequenceOrientation,
  OnboardingStep,
  OnboardingStepStatus,
} from "./onboarding-progress-sequence-core.js";
