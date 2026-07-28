"use client";

import { MotionProvider } from "easecraft";
import {
  AnimatedPricingComparison,
  type PricingPeriod,
  type PricingPlan,
} from "easecraft-registry/compositions/animated-pricing-comparison";
import { CommandPalette } from "easecraft-registry/compositions/command-palette";
import { ExpandableProjectCard } from "easecraft-registry/compositions/expandable-project-card";
import {
  FilterableWorkGallery,
  type FilterableWorkCategory,
  type FilterableWorkItem,
} from "easecraft-registry/compositions/filterable-work-gallery";
import {
  MobileNavigationPanel,
  type MobileNavigationSection,
} from "easecraft-registry/compositions/mobile-navigation-panel";
import {
  NotificationCenter,
  type NotificationCenterItem,
} from "easecraft-registry/compositions/notification-center";
import {
  OnboardingProgressSequence,
  type OnboardingStep,
} from "easecraft-registry/compositions/onboarding-progress-sequence";
import { useState } from "react";
import type { CompositionSlug } from "easecraft-registry";

const paletteItems = [
  {
    id: "project",
    keywords: ["create", "workspace"],
    label: "Create project",
    shortcut: "N",
  },
  {
    id: "settings",
    keywords: ["preferences", "account"],
    label: "Open settings",
    shortcut: "Ctrl+,",
  },
  { disabled: true, id: "archive", label: "Archive workspace" },
] as const;

const previewProject = {
  id: "easecraft",
  meta: "React / Anime.js",
  status: "Active",
  summary: "Accessible motion primitives and copyable compositions.",
  title: "Easecraft",
} as const;

const previewNotifications = [
  {
    createdAt: "Now",
    description: "Composition docs are available locally.",
    duration: Infinity,
    id: "docs",
    title: "Preview ready",
  },
  {
    createdAt: "4m",
    description: "Keyboard checks passed.",
    duration: Infinity,
    id: "access",
    priority: "assertive",
    title: "Accessibility verified",
  },
  {
    createdAt: "1h",
    id: "build",
    read: true,
    title: "Production build complete",
  },
] as const satisfies readonly NotificationCenterItem[];

const galleryCategories = [
  { label: "Product", value: "product" },
  { label: "Editorial", value: "editorial" },
  { label: "Identity", value: "identity" },
] as const satisfies readonly FilterableWorkCategory[];

const galleryItems = [
  {
    categories: ["product"],
    description: "Accessible motion infrastructure.",
    id: "easecraft",
    media: "EC",
    meta: "Open source",
    title: "Easecraft",
    year: "2026",
  },
  {
    categories: ["editorial", "identity"],
    description: "Publication and identity system.",
    id: "field-notes",
    media: "FN",
    meta: "Studio",
    title: "Field Notes",
    year: "2025",
  },
  {
    categories: ["product", "identity"],
    id: "relay",
    media: "RL",
    meta: "SaaS",
    title: "Relay",
    year: "2025",
  },
  {
    categories: ["editorial"],
    id: "index",
    media: "IX",
    meta: "Archive",
    title: "Index",
    year: "2024",
  },
] as const satisfies readonly FilterableWorkItem[];

const onboardingSteps = [
  {
    content: (
      <div className="composition-onboarding-step">
        <span>01 / Identity</span>
        <h3>Set up your profile</h3>
        <p>Choose how your teammates will recognize you across the workspace.</p>
        <div className="composition-onboarding-fields">
          <label>
            Display name
            <input defaultValue="Avery Stone" />
          </label>
          <label>
            Role
            <select defaultValue="Design">
              <option>Design</option>
              <option>Engineering</option>
              <option>Product</option>
            </select>
          </label>
        </div>
      </div>
    ),
    description: "Your basics",
    id: "profile",
    label: "Profile",
  },
  {
    content: (
      <div className="composition-onboarding-step">
        <span>02 / Workspace</span>
        <h3>Name your shared space</h3>
        <p>This is where projects, motion decisions, and collaborators come together.</p>
        <div className="composition-onboarding-fields">
          <label>
            Workspace name
            <input defaultValue="Northstar Studio" />
          </label>
          <label>
            Team size
            <select defaultValue="2-10 people">
              <option>Just me</option>
              <option>2-10 people</option>
              <option>11-50 people</option>
            </select>
          </label>
        </div>
      </div>
    ),
    description: "Shared context",
    id: "workspace",
    label: "Workspace",
  },
  {
    content: (
      <div className="composition-onboarding-step">
        <span>03 / Collaborate</span>
        <h3>Invite your team</h3>
        <p>Add a collaborator now or continue and return to invitations later.</p>
        <div className="composition-onboarding-fields composition-onboarding-fields-single">
          <label>
            Teammate email
            <input inputMode="email" placeholder="name@company.com" type="email" />
          </label>
        </div>
      </div>
    ),
    description: "Invite people",
    id: "team",
    label: "Team",
    optional: true,
  },
  {
    content: (
      <div className="composition-onboarding-step composition-onboarding-ready">
        <span>04 / Ready</span>
        <h3>Your workspace is ready</h3>
        <p>Review the setup, then finish onboarding and start your first project.</p>
        <ul>
          <li>Profile details added</li>
          <li>Workspace preferences selected</li>
          <li>Invitations can be managed later</li>
        </ul>
      </div>
    ),
    description: "Review setup",
    id: "ready",
    label: "Ready",
  },
] as const satisfies readonly OnboardingStep[];

const navigationSections = [
  {
    id: "workspace",
    items: [
      {
        current: true,
        description: "Team activity and status",
        href: "#overview",
        icon: "01",
        id: "overview",
        label: "Overview",
      },
      {
        badge: "12",
        description: "Active motion systems",
        href: "#projects",
        icon: "02",
        id: "projects",
        label: "Projects",
      },
      {
        description: "Components and compositions",
        href: "#library",
        icon: "03",
        id: "library",
        label: "Library",
      },
    ],
    label: "Workspace",
  },
  {
    id: "manage",
    items: [
      {
        description: "Members and permissions",
        href: "#team",
        icon: "04",
        id: "team",
        label: "Team",
      },
      {
        description: "Available after launch",
        disabled: true,
        href: "#billing",
        icon: "05",
        id: "billing",
        label: "Billing",
      },
    ],
    label: "Manage",
  },
] as const satisfies readonly MobileNavigationSection[];

const pricingPeriods = [
  {
    announcement: "Monthly billing selected.",
    id: "monthly",
    label: "Monthly",
    suffix: "/mo",
  },
  {
    announcement: "Annual billing selected. Save up to 20 percent.",
    badge: "Save 20%",
    id: "annual",
    label: "Annual",
    suffix: "/mo, annual",
  },
] as const satisfies readonly PricingPeriod[];

const pricingPlans = [
  {
    actionLabel: "Choose Solo",
    description: "For independent makers shipping focused work.",
    features: [
      { id: "projects", label: "3 active projects" },
      { id: "history", label: "30-day history" },
      { id: "collaboration", included: false, label: "Team collaboration" },
    ],
    id: "solo",
    name: "Solo",
    prices: { annual: 10, monthly: 12 },
  },
  {
    actionLabel: "Choose Studio",
    badge: "Most popular",
    description: "For teams building systems together.",
    features: [
      { id: "projects", label: "Unlimited projects" },
      { id: "history", label: "Unlimited history" },
      { id: "collaboration", label: "Up to 10 teammates" },
    ],
    id: "studio",
    name: "Studio",
    prices: { annual: 26, monthly: 32 },
    recommended: true,
  },
  {
    actionLabel: "Choose Scale",
    description: "For organizations coordinating many teams.",
    features: [
      { id: "projects", label: "Unlimited projects" },
      { id: "history", label: "Audit log and SSO" },
      { id: "collaboration", label: "Unlimited teammates" },
    ],
    id: "scale",
    name: "Scale",
    prices: { annual: 58, monthly: 72 },
  },
] as const satisfies readonly PricingPlan[];

interface CompositionPreviewProps {
  readonly reducedMotion?: boolean;
  readonly slug: CompositionSlug;
}

export function CompositionPreview({ reducedMotion = false, slug }: CompositionPreviewProps) {
  const [lastCommand, setLastCommand] = useState("No command selected");
  const [notifications, setNotifications] =
    useState<readonly NotificationCenterItem[]>(previewNotifications);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [lastDestination, setLastDestination] = useState("overview");
  const [selectedPricingPlan, setSelectedPricingPlan] = useState("No plan selected");

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      {slug === "command-palette" ? (
        <div className="composition-command-preview">
          <span className="composition-preview-index">01 / Keyboard surface</span>
          <strong>Move without leaving context.</strong>
          <p>{lastCommand}</p>
          <CommandPalette
            className="composition-command-shell"
            closeClassName="composition-command-close"
            contentClassName="composition-command-dialog"
            emptyClassName="composition-command-empty"
            inputClassName="composition-command-input"
            items={paletteItems}
            listClassName="composition-command-list"
            onSelect={(item) => {
              setLastCommand(item.label);
            }}
            optionClassName="composition-command-option"
            overlayClassName="composition-command-overlay"
            trigger={
              <button className="composition-command-trigger" type="button">
                <span>Open commands</span>
                <kbd>Ctrl K</kbd>
              </button>
            }
          />
        </div>
      ) : slug === "expandable-project-card" ? (
        <ExpandableProjectCard
          actions={
            <div className="composition-project-actions">
              <a href="/components/animated-accordion">View foundation</a>
              <button type="button">Pin project</button>
            </div>
          }
          articleClassName="composition-project-card"
          bodyClassName="composition-project-body"
          contentClassName="composition-project-content"
          defaultExpanded
          headerClassName="composition-project-header"
          itemClassName="composition-project-item"
          project={previewProject}
          triggerClassName="composition-project-trigger"
        >
          <p>
            Nine production-ready components, typed source graphs, and deterministic install plans.
          </p>
          <dl className="composition-project-stats">
            <div>
              <dt>Components</dt>
              <dd>09</dd>
            </div>
            <div>
              <dt>Compositions</dt>
              <dd>07</dd>
            </div>
          </dl>
        </ExpandableProjectCard>
      ) : slug === "notification-center" ? (
        <NotificationCenter
          actionClassName="composition-notification-action"
          centerClassName="composition-notification-center"
          closeClassName="composition-notification-close"
          contentClassName="composition-notification-toast"
          controlsClassName="composition-notification-controls"
          countClassName="composition-notification-count"
          duration={Infinity}
          emptyClassName="composition-notification-empty"
          headerClassName="composition-notification-header"
          itemClassName="composition-notification-item"
          items={notifications}
          listClassName="composition-notification-list"
          onItemsChange={setNotifications}
          toastClassName="composition-notification-toast-item"
          viewportClassName="composition-notification-viewport"
          viewportStyle={{ inset: "auto", position: "relative", width: "100%" }}
        />
      ) : slug === "filterable-work-gallery" ? (
        <FilterableWorkGallery
          categories={galleryCategories}
          controlClassName="composition-gallery-control"
          controlsClassName="composition-gallery-controls"
          emptyClassName="composition-gallery-empty"
          galleryClassName="composition-gallery"
          gridClassName="composition-gallery-grid"
          itemClassName="composition-gallery-card"
          items={galleryItems}
          metaClassName="composition-gallery-meta"
          resultClassName="composition-gallery-results"
          tagsClassName="composition-gallery-tags"
        />
      ) : slug === "onboarding-progress-sequence" ? (
        <OnboardingProgressSequence
          actionsClassName="composition-onboarding-actions"
          backButtonClassName="composition-onboarding-back"
          className="composition-onboarding"
          completeLabel={onboardingComplete ? "Setup complete" : "Finish setup"}
          continueButtonClassName="composition-onboarding-continue"
          onComplete={() => {
            setOnboardingComplete(true);
          }}
          panelClassName="composition-onboarding-panel"
          statusClassName="composition-onboarding-status"
          stepLabelClassName="composition-onboarding-label"
          steps={onboardingSteps}
        />
      ) : slug === "mobile-navigation-panel" ? (
        <div className="composition-mobile-launcher">
          <div className="composition-mobile-launcher-header">
            <span className="composition-mobile-launcher-brand" aria-label="Easecraft">
              EC
            </span>
            <MobileNavigationPanel
              badgeClassName="composition-mobile-badge"
              brand={
                <div className="composition-mobile-brand-lockup">
                  <span>EC</span>
                  <div>
                    <strong>Easecraft</strong>
                    <small>Motion systems</small>
                  </div>
                </div>
              }
              brandClassName="composition-mobile-brand"
              className="composition-mobile-navigation"
              closeClassName="composition-mobile-close"
              contentClassName="composition-mobile-panel"
              footer={
                <div className="composition-mobile-profile">
                  <span aria-hidden="true">AS</span>
                  <div>
                    <strong>Avery Stone</strong>
                    <small>Designer</small>
                  </div>
                  <button type="button">Sign out</button>
                </div>
              }
              footerClassName="composition-mobile-footer"
              itemClassName="composition-mobile-item"
              itemCopyClassName="composition-mobile-item-copy"
              itemDescriptionClassName="composition-mobile-item-description"
              itemLabelClassName="composition-mobile-item-label"
              listClassName="composition-mobile-list"
              onNavigate={(item, event) => {
                event.preventDefault();
                setLastDestination(item.id);
              }}
              overlayClassName="composition-mobile-overlay"
              positionerClassName="composition-mobile-positioner"
              sectionClassName="composition-mobile-section"
              sectionLabelClassName="composition-mobile-section-label"
              sections={navigationSections}
              title="Menu"
              trigger={
                <button
                  aria-label="Open mobile navigation"
                  className="composition-mobile-trigger"
                  title="Open mobile navigation"
                  type="button"
                >
                  <span aria-hidden="true" className="composition-mobile-menu-icon" />
                </button>
              }
            />
          </div>
          <div className="composition-mobile-launcher-copy">
            <span>06 / Navigation sheet</span>
            <h3>Everything in reach.</h3>
            <p>Last destination: {lastDestination}</p>
          </div>
        </div>
      ) : (
        <div className="composition-pricing-preview">
          <div className="composition-pricing-heading">
            <span>07 / Flexible billing</span>
            <strong>Plans that move with you.</strong>
            <p>{selectedPricingPlan}</p>
          </div>
          <AnimatedPricingComparison
            actionClassName="composition-pricing-action"
            badgeClassName="composition-pricing-badge"
            controlsClassName="composition-pricing-controls"
            descriptionClassName="composition-pricing-description"
            featureClassName="composition-pricing-feature"
            featureListClassName="composition-pricing-features"
            featureStateClassName="composition-pricing-feature-state"
            gridClassName="composition-pricing-grid"
            onSelectPlan={(plan) => {
              const selectedPlan = pricingPlans.find((entry) => entry.id === plan.id);

              setSelectedPricingPlan(`${selectedPlan?.name ?? plan.id} selected`);
            }}
            periodBadgeClassName="composition-pricing-period-badge"
            periodButtonClassName="composition-pricing-period"
            periods={pricingPeriods}
            planClassName="composition-pricing-plan"
            plans={pricingPlans}
            priceClassName="composition-pricing-price"
            rootClassName="composition-pricing"
            statusClassName="composition-pricing-status"
            titleClassName="composition-pricing-title"
          />
        </div>
      )}
    </MotionProvider>
  );
}
