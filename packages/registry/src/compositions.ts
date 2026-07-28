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
] as const satisfies readonly CompositionRegistryEntry<ComponentSlug>[]);

export type CompositionSlug = (typeof compositionEntries)[number]["slug"];
