// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MotionProvider } from "easecraft";

import { AnimatedPricingComparison } from "../source/compositions/animated-pricing-comparison.package.js";

const periods = [
  {
    announcement: "Monthly billing selected.",
    id: "monthly",
    label: "Monthly",
    suffix: "/month",
  },
  {
    announcement: "Annual billing selected. Save up to 20 percent.",
    badge: "Save 20%",
    id: "annual",
    label: "Annual",
    suffix: "/month, billed annually",
  },
] as const;

const plans = [
  {
    actionHref: "/start",
    actionLabel: "Start free",
    description: "For individual projects.",
    features: [
      { id: "projects", label: "Three projects" },
      { id: "support", included: false, label: "Priority support" },
    ],
    id: "starter",
    name: "Starter",
    prices: { annual: 8, monthly: 10 },
  },
  {
    actionLabel: "Choose Studio",
    badge: "Most popular",
    description: "For collaborative teams.",
    features: [
      { id: "projects", label: "Unlimited projects" },
      { id: "support", label: "Priority support" },
    ],
    id: "studio",
    name: "Studio",
    prices: { annual: 24, monthly: 30 },
    recommended: true,
  },
] as const;

afterEach(() => {
  cleanup();
});

function getAccessiblePrice(container: HTMLElement, planId: string) {
  return container.querySelector<HTMLElement>(
    `[data-plan-id="${planId}"] [data-easecraft-number-accessible]`,
  )?.textContent;
}

describe("AnimatedPricingComparison", () => {
  it("renders semantic controls, named plan articles, prices, and feature states", () => {
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedPricingComparison periods={periods} plans={plans} />
      </MotionProvider>,
    );

    expect(view.getByRole("group", { name: "Billing period" })).toBeTruthy();
    expect(view.getByRole("button", { name: "Monthly" }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getAllByRole("article")).toHaveLength(2);
    expect(view.getByRole("article", { name: "Starter" })).toBeTruthy();
    expect(view.getByRole("article", { name: "Studio" })).toBeTruthy();
    expect(getAccessiblePrice(view.container, "starter")).toBe("$10/month");
    expect(view.getByText("Most popular")).toBeTruthy();
    expect(view.getByText("Not included")).toBeTruthy();
    expect(view.getByRole("link", { name: "Start free" }).getAttribute("href")).toBe("/start");
  });

  it("switches billing periods and reports the selected period", () => {
    const onPeriodChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedPricingComparison
          onPeriodChange={onPeriodChange}
          periods={periods}
          plans={plans}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: /Annual/ }));

    expect(onPeriodChange).toHaveBeenCalledWith("annual");
    expect(view.getByRole("button", { name: /Annual/ }).getAttribute("aria-pressed")).toBe("true");
    expect(view.getByRole("status").textContent).toBe(
      "Annual billing selected. Save up to 20 percent.",
    );
    expect(getAccessiblePrice(view.container, "starter")).toBe("$8/month, billed annually");
    expect(getAccessiblePrice(view.container, "studio")).toBe("$24/month, billed annually");
  });

  it("reports controlled changes without changing the displayed period", () => {
    const onPeriodChange = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedPricingComparison
          onPeriodChange={onPeriodChange}
          period="monthly"
          periods={periods}
          plans={plans}
        />
      </MotionProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: /Annual/ }));

    expect(onPeriodChange).toHaveBeenCalledWith("annual");
    expect(view.getByRole("button", { name: "Monthly" }).getAttribute("aria-pressed")).toBe("true");
    expect(getAccessiblePrice(view.container, "starter")).toBe("$10/month");
  });

  it("supports disabled periods, custom number formatting, and plan selection", () => {
    const onSelectPlan = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedPricingComparison
          currencyPrefix="EUR "
          formatOptions={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
          locale="en-US"
          onSelectPlan={onSelectPlan}
          periods={[periods[0], { ...periods[1], disabled: true }]}
          plans={plans}
        />
      </MotionProvider>,
    );

    expect(view.getByRole("button", { name: /Annual/ }).hasAttribute("disabled")).toBe(true);
    expect(getAccessiblePrice(view.container, "studio")).toBe("EUR 30.0/month");
    fireEvent.click(view.getByRole("button", { name: "Choose Studio" }));
    expect(onSelectPlan).toHaveBeenCalledWith(plans[1]);
  });

  it("renders disabled actions without invoking selection", () => {
    const onSelectPlan = vi.fn();
    const view = render(
      <MotionProvider reducedMotion="always">
        <AnimatedPricingComparison
          onSelectPlan={onSelectPlan}
          periods={periods}
          plans={[{ ...plans[1], actionDisabled: true, actionHref: "/studio" }]}
        />
      </MotionProvider>,
    );
    const action = view.getByRole("button", { name: "Choose Studio" });

    expect(action.hasAttribute("disabled")).toBe(true);
    fireEvent.click(action);
    expect(onSelectPlan).not.toHaveBeenCalled();
  });

  it("rejects invalid periods, plans, features, and prices", () => {
    expect(() => render(<AnimatedPricingComparison periods={[]} plans={plans} />)).toThrow(
      "AnimatedPricingComparison requires at least one billing period.",
    );
    expect(() =>
      render(<AnimatedPricingComparison periods={[periods[0], periods[0]]} plans={plans} />),
    ).toThrow("AnimatedPricingComparison received a duplicate period id: monthly");
    expect(() =>
      render(
        <AnimatedPricingComparison periods={[{ ...periods[0], disabled: true }]} plans={plans} />,
      ),
    ).toThrow("AnimatedPricingComparison requires at least one enabled billing period.");
    expect(() =>
      render(<AnimatedPricingComparison period="missing" periods={periods} plans={plans} />),
    ).toThrow("AnimatedPricingComparison period references an unknown period: missing");
    expect(() => render(<AnimatedPricingComparison periods={periods} plans={[]} />)).toThrow(
      "AnimatedPricingComparison requires at least one pricing plan.",
    );
    expect(() =>
      render(<AnimatedPricingComparison periods={periods} plans={[plans[0], plans[0]]} />),
    ).toThrow("AnimatedPricingComparison received a duplicate plan id: starter");
    expect(() =>
      render(
        <AnimatedPricingComparison
          periods={periods}
          plans={[{ ...plans[0], features: [plans[0].features[0], plans[0].features[0]] }]}
        />,
      ),
    ).toThrow("AnimatedPricingComparison plan starter received a duplicate feature id: projects");
    expect(() =>
      render(
        <AnimatedPricingComparison
          periods={periods}
          plans={[{ ...plans[0], prices: { monthly: 10 } }]}
        />,
      ),
    ).toThrow("AnimatedPricingComparison plan starter is missing a price for period: annual");
    expect(() =>
      render(
        <AnimatedPricingComparison
          periods={periods}
          plans={[{ ...plans[0], prices: { annual: -1, monthly: 10 } }]}
        />,
      ),
    ).toThrow(
      "AnimatedPricingComparison plan starter received an invalid price for period annual: -1",
    );
  });
});
