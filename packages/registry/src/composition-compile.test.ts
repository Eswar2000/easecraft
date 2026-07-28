import { cpSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createProgram,
  flattenDiagnosticMessageText,
  getPreEmitDiagnostics,
  JsxEmit,
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget,
} from "typescript";
import { afterEach, describe, expect, it } from "vitest";

import { getCompositionInstallPlan, type RegistryDeliveryMode } from "./index.js";

const registryRoot = fileURLToPath(new URL("../", import.meta.url));
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
const temporaryDirectories: string[] = [];

function materializeAndCompile(mode: RegistryDeliveryMode) {
  const plan = getCompositionInstallPlan("command-palette", mode);
  const temporaryDirectory = mkdtempSync(resolve(registryRoot, ".tmp-command-palette-"));
  temporaryDirectories.push(temporaryDirectory);

  const rootNames = plan.files.map((file) => {
    const destination = resolve(temporaryDirectory, file.destinationPath);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(resolve(workspaceRoot, file.sourcePath), destination);
    return destination;
  });
  const program = createProgram({
    options: {
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      exactOptionalPropertyTypes: true,
      jsx: JsxEmit.ReactJSX,
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.Bundler,
      noEmit: true,
      noUncheckedIndexedAccess: true,
      skipLibCheck: true,
      strict: true,
      target: ScriptTarget.ES2022,
    },
    rootNames,
  });

  return getPreEmitDiagnostics(program).map((diagnostic) =>
    flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
  );
}

afterEach(() => {
  temporaryDirectories.splice(0).forEach((directory) => {
    rmSync(directory, { force: true, recursive: true });
  });
});

describe("Command Palette generated source", () => {
  it("compiles with package-backed component imports", () => {
    expect(materializeAndCompile("package")).toEqual([]);
  });

  it("compiles with copied component source", () => {
    expect(materializeAndCompile("copy-source")).toEqual([]);
  });
});
