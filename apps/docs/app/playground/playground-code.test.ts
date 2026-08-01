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

  it("generates NumberTicker values, formatting, and announcement props", () => {
    const code = generatePlaygroundCode(
      parsePlaygroundState({
        announce: "assertive",
        component: "number-ticker",
        delay: 80,
        duration: 720,
        from: -250,
        locale: "de-DE",
        prefix: "EUR ",
        suffix: " total",
        value: 18_750,
      }),
    );

    expect(code).toContain('import { MotionProvider, NumberTicker } from "easecraft";');
    expect(code).toContain('announce="assertive"');
    expect(code).toContain("delay={80}");
    expect(code).toContain("duration={720}");
    expect(code).toContain("from={-250}");
    expect(code).toContain('locale={"de-DE"}');
    expect(code).toContain('prefix={"EUR "}');
    expect(code).toContain('suffix={" total"}');
    expect(code).toContain("value={18750}");
    expect(code).not.toContain("distance=");
  });

  it("derives the package install command from registry metadata", () => {
    expect(getPlaygroundInstallCommand(getDefaultPlaygroundState("text-reveal"))).toBe(
      "pnpm add easecraft@0.0.0",
    );
  });

  it("derives copy-source imports and dependencies from registry metadata", () => {
    const state = getDefaultPlaygroundState("staggered-list");
    const code = generatePlaygroundCode(state, "copy-source");

    expect(code).toContain(
      'import { StaggeredList } from "@/components/easecraft/staggered-list";',
    );
    expect(code).toContain(
      'import { MotionProvider } from "@/components/easecraft/motion-provider";',
    );
    expect(code).not.toContain('from "easecraft"');
    expect(getPlaygroundInstallCommand(state, "copy-source")).toContain("animejs@4.5.0");
    expect(getPlaygroundInstallCommand(state, "copy-source")).not.toContain("easecraft@0.0.0");
  });

  it("generates semantic token overrides from the selected motion values", () => {
    const code = generatePlaygroundCode(
      parsePlaygroundState({
        component: "text-reveal",
        distance: 24,
        duration: 640,
        stagger: 90,
      }),
      "token-override",
    );

    expect(code).toContain("type MotionTokenOverrides");
    expect(code).toContain("distance: { medium: 24 }");
    expect(code).toContain("duration: { normal: 640 }");
    expect(code).toContain("stagger: { normal: 90 }");
    expect(code).toContain("tokens={motionTokens}");
    expect(code).toContain('distance="medium"');
    expect(code).toContain('duration="normal"');
    expect(code).toContain('stagger="normal"');
  });

  it("omits stagger overrides for Motion Dialog token templates", () => {
    const code = generatePlaygroundCode(
      getDefaultPlaygroundState("motion-dialog"),
      "token-override",
    );

    expect(code).not.toContain("stagger:");
    expect(code).toContain('distance="medium"');
    expect(code).toContain('duration="normal"');
  });

  it("derives NumberTicker copy-source imports and duration-only token overrides", () => {
    const state = parsePlaygroundState({ component: "number-ticker", duration: 720 });
    const copySourceCode = generatePlaygroundCode(state, "copy-source");
    const tokenCode = generatePlaygroundCode(state, "token-override");

    expect(copySourceCode).toContain(
      'import { NumberTicker } from "@/components/easecraft/number-ticker";',
    );
    expect(getPlaygroundInstallCommand(state, "copy-source")).toContain("animejs@4.5.0");
    expect(tokenCode).toContain("duration: { normal: 720 }");
    expect(tokenCode).toContain('duration="normal"');
    expect(tokenCode).not.toContain("distance:");
    expect(tokenCode).not.toContain("stagger:");
  });

  it("generates Animated Tabs data and interaction settings", () => {
    const code = generatePlaygroundCode(
      parsePlaygroundState({
        activationMode: "manual",
        component: "animated-tabs",
        distance: 8,
        duration: 640,
        loop: false,
        orientation: "vertical",
        tab: "metrics",
      }),
    );

    expect(code).toContain('import { MotionProvider, AnimatedTabs } from "easecraft";');
    expect(code).toContain("const workspaceTabs = [");
    expect(code).toContain('activationMode="manual"');
    expect(code).toContain('defaultValue="metrics"');
    expect(code).toContain("distance={8}");
    expect(code).toContain("duration={640}");
    expect(code).toContain("loop={false}");
    expect(code).toContain('orientation="vertical"');
    expect(code).not.toContain("delay=");
    expect(code).not.toContain("stagger=");
  });

  it("derives Animated Tabs copy-source imports and native token overrides", () => {
    const state = parsePlaygroundState({
      component: "animated-tabs",
      distance: 8,
      duration: 640,
    });
    const copySourceCode = generatePlaygroundCode(state, "copy-source");
    const tokenCode = generatePlaygroundCode(state, "token-override");

    expect(copySourceCode).toContain(
      'import { AnimatedTabs } from "@/components/easecraft/animated-tabs";',
    );
    expect(getPlaygroundInstallCommand(state, "copy-source")).toContain("animejs@4.5.0");
    expect(tokenCode).toContain("distance: { small: 8 }");
    expect(tokenCode).toContain("duration: { normal: 640 }");
    expect(tokenCode).toContain('distance="small"');
    expect(tokenCode).toContain('duration="normal"');
    expect(tokenCode).not.toContain("stagger:");
  });

  it("generates mode-correct Animated Accordion expansion props", () => {
    const multipleCode = generatePlaygroundCode(
      parsePlaygroundState({
        accordionMode: "multiple",
        component: "animated-accordion",
        duration: 640,
        expanded: ["lifecycle", "interruption"],
      }),
    );
    const collapsedSingleCode = generatePlaygroundCode(
      parsePlaygroundState({
        accordionMode: "single",
        collapsible: false,
        component: "animated-accordion",
        expanded: [],
      }),
    );

    expect(multipleCode).toContain(
      'import { MotionProvider, AnimatedAccordion } from "easecraft";',
    );
    expect(multipleCode).toContain("const systemDetails = [");
    expect(multipleCode).toContain('defaultValue={["lifecycle","interruption"]}');
    expect(multipleCode).toContain('mode="multiple"');
    expect(multipleCode).toContain("duration={640}");
    expect(multipleCode).not.toContain("collapsible=");
    expect(collapsedSingleCode).toContain("collapsible={false}");
    expect(collapsedSingleCode).toContain("defaultValue={undefined}");
    expect(collapsedSingleCode).toContain('mode="single"');
  });

  it("derives Animated Accordion copy-source imports and duration token overrides", () => {
    const state = getDefaultPlaygroundState("animated-accordion");
    const copySourceCode = generatePlaygroundCode(state, "copy-source");
    const tokenCode = generatePlaygroundCode(state, "token-override");

    expect(copySourceCode).toContain(
      'import { AnimatedAccordion } from "@/components/easecraft/animated-accordion";',
    );
    expect(getPlaygroundInstallCommand(state, "copy-source")).toContain(
      "@radix-ui/react-accordion@",
    );
    expect(tokenCode).toContain("duration: { normal: 300 }");
    expect(tokenCode).toContain('duration="normal"');
    expect(tokenCode).not.toContain("distance:");
    expect(tokenCode).not.toContain("stagger:");
  });
});
