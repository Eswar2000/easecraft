import { useId, useState, type ComponentType, type ReactNode } from "react";

export interface PricingPeriod {
  readonly announcement: string;
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
  readonly id: string;
  readonly label: ReactNode;
  readonly suffix: string;
}

export interface PricingFeature {
  readonly id: string;
  readonly included?: boolean;
  readonly label: ReactNode;
  readonly value?: ReactNode;
}

export interface PricingPlan {
  readonly actionDisabled?: boolean;
  readonly actionHref?: string;
  readonly actionLabel: ReactNode;
  readonly badge?: ReactNode;
  readonly description?: ReactNode;
  readonly features: readonly PricingFeature[];
  readonly id: string;
  readonly name: ReactNode;
  readonly prices: Readonly<Record<string, number>>;
  readonly recommended?: boolean;
}

export interface PricingNumberAdapterProps {
  readonly className?: string;
  readonly formatOptions?: Intl.NumberFormatOptions;
  readonly locale?: Intl.LocalesArgument;
  readonly prefix: string;
  readonly suffix: string;
  readonly value: number;
}

export interface AnimatedPricingComparisonProps {
  readonly actionClassName?: string;
  readonly badgeClassName?: string;
  readonly comparisonLabel?: string;
  readonly controlsClassName?: string;
  readonly controlsLabel?: string;
  readonly currencyPrefix?: string;
  readonly defaultPeriod?: string;
  readonly descriptionClassName?: string;
  readonly featureClassName?: string;
  readonly featureListClassName?: string;
  readonly featureStateClassName?: string;
  readonly formatOptions?: Intl.NumberFormatOptions;
  readonly gridClassName?: string;
  readonly locale?: Intl.LocalesArgument;
  readonly onPeriodChange?: (periodId: string) => void;
  readonly onSelectPlan?: (plan: PricingPlan) => void;
  readonly period?: string | undefined;
  readonly periodButtonClassName?: string;
  readonly periodBadgeClassName?: string;
  readonly periods: readonly PricingPeriod[];
  readonly planClassName?: string;
  readonly plans: readonly PricingPlan[];
  readonly priceClassName?: string;
  readonly recommendedLabel?: ReactNode;
  readonly rootClassName?: string;
  readonly statusClassName?: string;
  readonly titleClassName?: string;
}

function validatePricing(
  periods: readonly PricingPeriod[],
  plans: readonly PricingPlan[],
  period: string | undefined,
  defaultPeriod: string | undefined,
): PricingPeriod {
  if (periods.length === 0) {
    throw new Error("AnimatedPricingComparison requires at least one billing period.");
  }

  const periodIds = new Set<string>();
  periods.forEach((entry) => {
    if (periodIds.has(entry.id)) {
      throw new Error(`AnimatedPricingComparison received a duplicate period id: ${entry.id}`);
    }

    periodIds.add(entry.id);
  });

  const firstEnabledPeriod = periods.find((entry) => !entry.disabled);

  if (!firstEnabledPeriod) {
    throw new Error("AnimatedPricingComparison requires at least one enabled billing period.");
  }

  for (const [name, value] of [
    ["period", period],
    ["defaultPeriod", defaultPeriod],
  ] as const) {
    if (value !== undefined && !periodIds.has(value)) {
      throw new Error(`AnimatedPricingComparison ${name} references an unknown period: ${value}`);
    }

    if (value !== undefined && periods.find((entry) => entry.id === value)?.disabled) {
      throw new Error(`AnimatedPricingComparison ${name} references a disabled period: ${value}`);
    }
  }

  if (plans.length === 0) {
    throw new Error("AnimatedPricingComparison requires at least one pricing plan.");
  }

  const planIds = new Set<string>();
  plans.forEach((plan) => {
    if (planIds.has(plan.id)) {
      throw new Error(`AnimatedPricingComparison received a duplicate plan id: ${plan.id}`);
    }

    planIds.add(plan.id);
    const featureIds = new Set<string>();
    plan.features.forEach((feature) => {
      if (featureIds.has(feature.id)) {
        throw new Error(
          `AnimatedPricingComparison plan ${plan.id} received a duplicate feature id: ${feature.id}`,
        );
      }

      featureIds.add(feature.id);
    });

    periods.forEach((entry) => {
      const price = plan.prices[entry.id];

      if (price === undefined) {
        throw new Error(
          `AnimatedPricingComparison plan ${plan.id} is missing a price for period: ${entry.id}`,
        );
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error(
          `AnimatedPricingComparison plan ${plan.id} received an invalid price for period ${entry.id}: ${price.toString()}`,
        );
      }
    });
  });

  return firstEnabledPeriod;
}

export function createAnimatedPricingComparison(
  PricingNumber: ComponentType<PricingNumberAdapterProps>,
) {
  function AnimatedPricingComparison(props: AnimatedPricingComparisonProps) {
    const controlled = Object.hasOwn(props, "period");
    const {
      actionClassName,
      badgeClassName,
      comparisonLabel = "Pricing plans",
      controlsClassName,
      controlsLabel = "Billing period",
      currencyPrefix = "$",
      defaultPeriod,
      descriptionClassName,
      featureClassName,
      featureListClassName,
      featureStateClassName,
      formatOptions = { maximumFractionDigits: 0 },
      gridClassName,
      locale,
      onPeriodChange,
      onSelectPlan,
      period,
      periodBadgeClassName,
      periodButtonClassName,
      periods,
      planClassName,
      plans,
      priceClassName,
      recommendedLabel = "Recommended",
      rootClassName,
      statusClassName,
      titleClassName,
    } = props;
    const firstEnabledPeriod = validatePricing(periods, plans, period, defaultPeriod);
    const [uncontrolledPeriod, setUncontrolledPeriod] = useState(
      () => defaultPeriod ?? firstEnabledPeriod.id,
    );
    const requestedPeriod = controlled ? (period ?? firstEnabledPeriod.id) : uncontrolledPeriod;
    const activePeriod =
      periods.find((entry) => entry.id === requestedPeriod && !entry.disabled) ??
      firstEnabledPeriod;
    const generatedId = useId();

    function selectPeriod(periodId: string) {
      if (periodId === activePeriod.id) {
        return;
      }

      if (!controlled) {
        setUncontrolledPeriod(periodId);
      }

      onPeriodChange?.(periodId);
    }

    return (
      <section
        aria-label={comparisonLabel}
        className={rootClassName}
        data-billing-period={activePeriod.id}
        data-easecraft-pricing-comparison=""
      >
        <div
          aria-label={controlsLabel}
          className={controlsClassName}
          data-easecraft-pricing-controls=""
          role="group"
        >
          {periods.map((entry) => (
            <button
              aria-pressed={entry.id === activePeriod.id}
              className={periodButtonClassName}
              data-easecraft-pricing-period=""
              disabled={entry.disabled}
              key={entry.id}
              onClick={() => {
                selectPeriod(entry.id);
              }}
              type="button"
            >
              <span>{entry.label}</span>
              {entry.badge ? (
                <span className={periodBadgeClassName} data-easecraft-pricing-period-badge="">
                  {entry.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <p
          aria-atomic="true"
          aria-live="polite"
          className={statusClassName}
          data-easecraft-pricing-status=""
          role="status"
        >
          {activePeriod.announcement}
        </p>
        <div className={gridClassName} data-easecraft-pricing-grid="">
          {plans.map((plan) => {
            const titleId = `easecraft-pricing-${generatedId}-${encodeURIComponent(plan.id)}`;
            const price = plan.prices[activePeriod.id];

            if (price === undefined) {
              return null;
            }

            return (
              <article
                aria-labelledby={titleId}
                className={planClassName}
                data-easecraft-pricing-plan=""
                data-plan-id={plan.id}
                data-recommended={plan.recommended ? true : undefined}
                key={plan.id}
              >
                <div data-easecraft-pricing-plan-header="">
                  <h3 className={titleClassName} id={titleId}>
                    {plan.name}
                  </h3>
                  {plan.recommended ? (
                    <span className={badgeClassName} data-easecraft-pricing-recommended="">
                      {plan.badge ?? recommendedLabel}
                    </span>
                  ) : plan.badge ? (
                    <span className={badgeClassName} data-easecraft-pricing-badge="">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                {plan.description ? (
                  <p className={descriptionClassName} data-easecraft-pricing-description="">
                    {plan.description}
                  </p>
                ) : null}
                <p className={priceClassName} data-easecraft-pricing-price="">
                  <PricingNumber
                    formatOptions={formatOptions}
                    prefix={currencyPrefix}
                    suffix={activePeriod.suffix}
                    value={price}
                    {...(locale !== undefined ? { locale } : {})}
                  />
                </p>
                <ul className={featureListClassName} data-easecraft-pricing-features="">
                  {plan.features.map((feature) => {
                    const included = feature.included ?? true;

                    return (
                      <li
                        className={featureClassName}
                        data-easecraft-pricing-feature=""
                        data-included={included}
                        key={feature.id}
                      >
                        <span
                          className={featureStateClassName}
                          data-easecraft-pricing-feature-state=""
                        >
                          {included ? "Included" : "Not included"}
                        </span>
                        <span>{feature.label}</span>
                        {feature.value ? (
                          <span data-easecraft-pricing-feature-value="">{feature.value}</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {plan.actionHref && !plan.actionDisabled ? (
                  <a
                    className={actionClassName}
                    data-easecraft-pricing-action=""
                    href={plan.actionHref}
                    onClick={() => {
                      onSelectPlan?.(plan);
                    }}
                  >
                    {plan.actionLabel}
                  </a>
                ) : (
                  <button
                    className={actionClassName}
                    data-easecraft-pricing-action=""
                    disabled={plan.actionDisabled}
                    onClick={() => {
                      onSelectPlan?.(plan);
                    }}
                    type="button"
                  >
                    {plan.actionLabel}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  AnimatedPricingComparison.displayName = "AnimatedPricingComparison";
  return AnimatedPricingComparison;
}
