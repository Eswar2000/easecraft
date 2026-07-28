"use client";

import { MotionProvider } from "easecraft";
import { CommandPalette } from "easecraft-registry/compositions/command-palette";
import { ExpandableProjectCard } from "easecraft-registry/compositions/expandable-project-card";
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

interface CompositionPreviewProps {
  readonly reducedMotion?: boolean;
  readonly slug: CompositionSlug;
}

export function CompositionPreview({ reducedMotion = false, slug }: CompositionPreviewProps) {
  const [lastCommand, setLastCommand] = useState("No command selected");

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
      ) : (
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
              <dd>02</dd>
            </div>
          </dl>
        </ExpandableProjectCard>
      )}
    </MotionProvider>
  );
}
