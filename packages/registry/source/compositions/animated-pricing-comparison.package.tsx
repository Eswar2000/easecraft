import { NumberTicker } from "easecraft";

import {
  createAnimatedPricingComparison,
  type PricingNumberAdapterProps,
} from "./animated-pricing-comparison-core.js";

function PricingNumber(props: PricingNumberAdapterProps) {
  return <NumberTicker announce="off" {...props} />;
}

export const AnimatedPricingComparison = createAnimatedPricingComparison(PricingNumber);

export type {
  AnimatedPricingComparisonProps,
  PricingFeature,
  PricingPeriod,
  PricingPlan,
} from "./animated-pricing-comparison-core.js";
