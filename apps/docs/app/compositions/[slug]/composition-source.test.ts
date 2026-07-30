import { describe, expect, it } from "vitest";

import {
  compositionSlugs,
  getCompositionInstallPlan,
  type CopySourceFile,
} from "easecraft-registry";

import { getCompositionDeliverySources, readCompositionSourceFile } from "./composition-source";
import { serializeCompositionSources } from "./composition-delivery-types";

describe("composition delivery sources", () => {
  it("materializes both delivery modes for every registered composition", () => {
    compositionSlugs.forEach((slug) => {
      const sources = getCompositionDeliverySources(slug);

      for (const mode of ["package", "copy-source"] as const) {
        const plan = getCompositionInstallPlan(slug, mode);

        expect(sources[mode].map((file) => file.destinationPath)).toEqual(
          plan.files.map((file) => file.destinationPath),
        );
        expect(sources[mode].every((file) => file.content.length > 0)).toBe(true);
        expect(sources[mode].every((file) => !("sourcePath" in file))).toBe(true);
      }
    });
  });

  it("loads the delivery-specific composition adapter", () => {
    const sources = getCompositionDeliverySources("command-palette");

    expect(sources.package.at(-1)?.content).toContain('from "easecraft"');
    expect(sources["copy-source"].at(-1)?.content).toContain('from "../motion-dialog.js"');
  });

  it("rejects source paths outside the registry allowlist", () => {
    const unsafeFile = {
      destinationPath: "components/easecraft/unsafe.ts",
      role: "utility",
      sourcePath: "../../package.json",
    } as const satisfies CopySourceFile;

    expect(() => readCompositionSourceFile(unsafeFile)).toThrow(
      "Unknown Easecraft source path: ../../package.json",
    );
  });

  it("serializes files deterministically with destination-path headers", () => {
    expect(
      serializeCompositionSources([
        { content: "export const one = 1;\n", destinationPath: "one.ts", role: "utility" },
        { content: "export const two = 2;", destinationPath: "two.ts", role: "component" },
      ]),
    ).toBe("// File: one.ts\nexport const one = 1;\n\n// File: two.ts\nexport const two = 2;\n");
  });
});
