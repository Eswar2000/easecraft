"use client";

import { MotionProvider } from "easecraft";
import { CommandPalette } from "easecraft-registry/compositions/command-palette";
import { ExpandableProjectCard } from "easecraft-registry/compositions/expandable-project-card";
import {
  FilterableWorkGallery,
  type FilterableWorkCategory,
  type FilterableWorkItem,
} from "easecraft-registry/compositions/filterable-work-gallery";
import {
  NotificationCenter,
  type NotificationCenterItem,
} from "easecraft-registry/compositions/notification-center";
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

interface CompositionPreviewProps {
  readonly reducedMotion?: boolean;
  readonly slug: CompositionSlug;
}

export function CompositionPreview({ reducedMotion = false, slug }: CompositionPreviewProps) {
  const [lastCommand, setLastCommand] = useState("No command selected");
  const [notifications, setNotifications] =
    useState<readonly NotificationCenterItem[]>(previewNotifications);

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
              <dd>04</dd>
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
      ) : (
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
      )}
    </MotionProvider>
  );
}
