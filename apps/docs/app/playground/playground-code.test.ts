import { describe, expect, it } from "vitest";

import { generatePlaygroundCode, getPlaygroundInstallCommand } from "./playground-code";
import { getDefaultPlaygroundState, parsePlaygroundState } from "./playground-state";

describe("playground code generation", () => {
  it("generates deterministic Text Reveal package code", () => {
    const code = generatePlaygroundCode(
      parsePlaygroundState({
        ...getDefaultPlaygroundState("text-reveal"),
        delay: 80,
        duration: 640,
        split: "characters",
        stagger: 25,
      }),
    );

    expect(code).toContain('import { MotionProvider, TextReveal } from "easecraft";');
    expect(code).toContain('reducedMotion="never"');
    expect(code).toContain("delay={80}");
    expect(code).toContain("duration={640}");
    expect(code).toContain('split="characters"');
    expect(code).toContain("stagger={25}");
    expect(code).not.toContain("order=");
  });

  it("generates only Staggered List controls and stable sample data", () => {
    const code = generatePlaygroundCode(
      parsePlaygroundState({
        component: "staggered-list",
        order: "reverse",
        preset: "rise",
        stagger: 90,
      }),
    );

    expect(code).toContain("const items = [");
    expect(code).toContain('order="reverse"');
    expect(code).toContain('preset="rise"');
    expect(code).toContain("interval={90}");
    expect(code).not.toContain("split=");
    expect(code).not.toContain("dismissible=");
  });

  it("generates Motion Dialog code without unsupported delay or stagger props", () => {
    const code = generatePlaygroundCode(
      parsePlaygroundState({
        component: "motion-dialog",
        dismissible: false,
        reducedMotion: true,
      }),
    );

    expect(code).toContain('import { MotionDialog, MotionProvider } from "easecraft";');
    expect(code).toContain('reducedMotion="always"');
    expect(code).toContain("dismissible={false}");
    expect(code).not.toContain("delay=");
    expect(code).not.toContain("stagger=");
    expect(code).not.toContain("interval=");
  });

  it("derives the package install command from registry metadata", () => {
    expect(getPlaygroundInstallCommand(getDefaultPlaygroundState("text-reveal"))).toBe(
      "pnpm add easecraft@0.0.0",
    );
  });
});
