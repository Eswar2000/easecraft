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
] as const satisfies readonly CompositionRegistryEntry<ComponentSlug>[]);

export type CompositionSlug = (typeof compositionEntries)[number]["slug"];
