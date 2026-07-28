import { componentEntries, type ComponentSlug } from "./components.js";
import { defineCompositionRegistry, type CompositionRegistryEntry } from "./schema.js";

const componentSlugs = componentEntries.map((component) => component.slug);

export const compositionEntries = defineCompositionRegistry(componentSlugs, [
  {
    accessibility: {
      announcement: "none",
      focusManagement: true,
      keyboard: [
        { behavior: "Opens or closes the palette globally.", keys: ["Control+K", "Meta+K"] },
        {
          behavior: "Moves the active option through enabled results.",
          keys: ["ArrowUp", "ArrowDown"],
        },
        { behavior: "Moves to the first or last enabled result.", keys: ["Home", "End"] },
        { behavior: "Runs the active command and closes the palette.", keys: ["Enter"] },
        { behavior: "Closes the modal palette and restores trigger focus.", keys: ["Escape"] },
      ],
      notes: [
        "Uses a modal dialog containing an aria-activedescendant combobox and linked listbox.",
        "Disabled commands remain discoverable but are skipped by keyboard selection.",
      ],
      pattern: "dialog-combobox",
    },
    category: "Navigation",
    componentDependencies: ["motion-dialog"],
    description: "Search and run application actions from a focus-safe modal command surface.",
    motion: {
      controlled: true,
      enter: true,
      exit: true,
      intrinsicSize: false,
      layout: false,
      reducedMotion: true,
      replay: true,
      viewport: false,
    },
    name: "Command Palette",
    slug: "command-palette",
    status: "implemented",
    tags: ["command", "dialog", "keyboard", "search"],
  },
  {
    accessibility: {
      announcement: "none",
      focusManagement: true,
      keyboard: [
        { behavior: "Expands or collapses the project details.", keys: ["Enter", "Space"] },
        {
          behavior: "Moves through links and actions inside expanded details.",
          keys: ["Tab", "Shift+Tab"],
        },
      ],
      notes: [
        "Uses an article containing one linked accordion heading, trigger, and region.",
        "Programmatic collapse returns focus from project actions to the disclosure trigger.",
      ],
      pattern: "article-disclosure",
    },
    category: "Content",
    componentDependencies: ["animated-accordion"],
    description: "Reveal project details and actions inside an accessible, variable-height card.",
    motion: {
      controlled: true,
      enter: true,
      exit: true,
      intrinsicSize: true,
      layout: false,
      reducedMotion: true,
      replay: true,
      viewport: false,
    },
    name: "Expandable Project Card",
    slug: "expandable-project-card",
    status: "implemented",
    tags: ["accordion", "card", "content", "project"],
  },
  {
    accessibility: {
      announcement: "configurable",
      focusManagement: true,
      keyboard: [
        {
          behavior: "Moves through center controls, feed items, and toast actions.",
          keys: ["Tab", "Shift+Tab"],
        },
        {
          behavior: "Activates mark-read, clear, and notification actions.",
          keys: ["Enter", "Space"],
        },
        { behavior: "Moves focus to the transient notification viewport.", keys: ["F8"] },
        { behavior: "Dismisses the active transient notification.", keys: ["Escape"] },
      ],
      notes: [
        "Keeps persistent notification history separate from transient polite or assertive announcements.",
        "Delegates pausable timers, swipe dismissal, queue limits, and retained exits to ToastStack.",
      ],
      pattern: "notification-center",
    },
    category: "Feedback",
    componentDependencies: ["toast-stack"],
    description: "Manage persistent unread history alongside queued, pausable live notifications.",
    motion: {
      controlled: true,
      enter: true,
      exit: true,
      intrinsicSize: false,
      layout: true,
      reducedMotion: true,
      replay: true,
      viewport: false,
    },
    name: "Notification Center",
    slug: "notification-center",
    status: "implemented",
    tags: ["feedback", "live-region", "notifications", "toast"],
  },
  {
    accessibility: {
      announcement: "polite",
      focusManagement: true,
      keyboard: [
        {
          behavior: "Moves through native category controls and project links.",
          keys: ["Tab", "Shift+Tab"],
        },
        { behavior: "Activates the focused category or project action.", keys: ["Enter", "Space"] },
      ],
      notes: [
        "Announces the filtered project count in one polite live region.",
        "Filtered projects become inert and transfer focus before retained exits complete.",
      ],
      pattern: "filterable-gallery",
    },
    category: "Content",
    componentDependencies: ["filter-grid"],
    description:
      "Filter a semantic project gallery with focus-safe exits and animated two-axis reflow.",
    motion: {
      controlled: true,
      enter: true,
      exit: true,
      intrinsicSize: false,
      layout: true,
      reducedMotion: true,
      replay: true,
      viewport: false,
    },
    name: "Filterable Work Gallery",
    slug: "filterable-work-gallery",
    status: "implemented",
    tags: ["filter", "gallery", "layout", "portfolio"],
  },
  {
    accessibility: {
      announcement: "polite",
      focusManagement: true,
      keyboard: [
        {
          behavior: "Moves focus through enabled progress steps without changing the active step.",
          keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
        },
        { behavior: "Moves focus to the first or last enabled step.", keys: ["Home", "End"] },
        { behavior: "Activates the focused step or navigation control.", keys: ["Enter", "Space"] },
        {
          behavior: "Moves between the step list, active panel, and navigation controls.",
          keys: ["Tab", "Shift+Tab"],
        },
      ],
      notes: [
        "Uses linked tab and tabpanel semantics with ordered complete, current, and upcoming states.",
        "Announces the active step position in one polite live region and skips disabled steps.",
      ],
      pattern: "onboarding-stepper",
    },
    category: "Workflow",
    componentDependencies: ["animated-tabs"],
    description:
      "Guide a controlled or self-managed setup flow with animated panels and explicit progress.",
    motion: {
      controlled: true,
      enter: true,
      exit: false,
      intrinsicSize: false,
      layout: true,
      reducedMotion: true,
      replay: true,
      viewport: false,
    },
    name: "Onboarding Progress Sequence",
    slug: "onboarding-progress-sequence",
    status: "implemented",
    tags: ["onboarding", "progress", "stepper", "workflow"],
  },
] as const satisfies readonly CompositionRegistryEntry<ComponentSlug>[]);

export type CompositionSlug = (typeof compositionEntries)[number]["slug"];
