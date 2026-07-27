import { describe, expect, it } from "vitest";

import {
  componentCategories,
  componentRegistry,
  componentSlugs,
  defineComponentRegistry,
  findComponent,
  getComponent,
  isComponentSlug,
  listComponents,
  listComponentsByCategory,
  type ComponentSlug,
} from "./index.js";

describe("componentRegistry", () => {
  it("contains the complete nine-component catalog in explorer order", () => {
    expect(componentSlugs).toEqual([
      "text-reveal",
      "number-ticker",
      "staggered-list",
      "animated-tabs",
      "motion-dialog",
      "toast-stack",
      "filter-grid",
      "scroll-reveal",
      "animated-accordion",
    ]);
    expect(componentRegistry).toHaveLength(9);
    expect(componentRegistry.map((component) => component.status)).toEqual(
      Array.from({ length: 9 }, () => "implemented"),
    );
  });

  it("provides complete package, motion, source, and accessibility metadata", () => {
    componentRegistry.forEach((component) => {
      expect(component.packageName).toBe("easecraft");
      expect(component.docsPath).toBe(`/components/${component.slug}`);
      expect(component.motion.reducedMotion).toBe(true);
      expect(component.dependencies.some((dependency) => dependency.name === "react")).toBe(true);
      expect(component.sourceFiles).toContainEqual({
        path: `src/${component.slug}.tsx`,
        role: "implementation",
      });
      expect(component.accessibility.notes.length).toBeGreaterThan(0);
    });
  });
});

describe("registry queries", () => {
  it("looks up exact slugs and safely handles arbitrary strings", () => {
    const slug: ComponentSlug = "animated-accordion";

    expect(getComponent(slug).exportName).toBe("AnimatedAccordion");
    expect(findComponent("missing-component")).toBeUndefined();
    expect(isComponentSlug("animated-accordion")).toBe(true);
    expect(isComponentSlug("missing-component")).toBe(false);
  });

  it("lists components without exposing a second catalog", () => {
    expect(listComponents()).toBe(componentRegistry);
    expect(componentCategories).toEqual(["Text", "Layout", "Overlay", "Feedback"]);
    expect(listComponentsByCategory("Layout").map((component) => component.slug)).toEqual([
      "staggered-list",
      "animated-tabs",
      "filter-grid",
      "scroll-reveal",
      "animated-accordion",
    ]);
    expect(listComponentsByCategory("Overlay").map((component) => component.slug)).toEqual([
      "motion-dialog",
    ]);
  });
});

describe("defineComponentRegistry", () => {
  const baseComponent = componentRegistry[0];

  it("rejects duplicate slugs", () => {
    expect(() =>
      defineComponentRegistry([
        baseComponent,
        {
          ...baseComponent,
          docsPath: "/components/text-reveal-copy",
          exportName: "TextRevealCopy",
        },
      ]),
    ).toThrow("Component registry received a duplicate slug: text-reveal");
  });

  it("rejects a docs route that does not match its slug", () => {
    expect(() =>
      defineComponentRegistry([
        {
          ...baseComponent,
          docsPath: "/components/wrong-route",
          exportName: "TextRevealCopy",
          slug: "text-reveal-copy",
        },
      ]),
    ).toThrow(
      "Component registry docs path must match its slug: text-reveal-copy -> /components/wrong-route",
    );
  });

  it("rejects duplicate source-file paths within an entry", () => {
    const implementation = baseComponent.sourceFiles[0];

    if (!implementation) {
      throw new Error("Expected TextReveal implementation metadata");
    }

    expect(() =>
      defineComponentRegistry([
        {
          ...baseComponent,
          docsPath: "/components/text-reveal-copy",
          exportName: "TextRevealCopy",
          slug: "text-reveal-copy",
          sourceFiles: [implementation, implementation],
        },
      ]),
    ).toThrow(
      "Component registry received a duplicate text-reveal-copy source file: src/text-reveal.tsx",
    );
  });
});
