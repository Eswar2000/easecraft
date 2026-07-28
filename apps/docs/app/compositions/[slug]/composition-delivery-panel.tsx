"use client";

import {
  getCompositionInstallPlan,
  getInstallCommand,
  registryPackageManagers,
  type CompositionSlug,
  type RegistryDeliveryMode,
  type RegistryPackageManager,
} from "easecraft-registry";
import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";

import {
  serializeCompositionSources,
  type CompositionDeliverySources,
} from "./composition-delivery-types";

interface CompositionDeliveryPanelProps {
  readonly slug: CompositionSlug;
  readonly sources: CompositionDeliverySources;
}

interface CopyFeedback {
  readonly key: string;
  readonly message: string;
  readonly success: boolean;
}

export function CompositionDeliveryPanel({ slug, sources }: CompositionDeliveryPanelProps) {
  const [mode, setMode] = useState<RegistryDeliveryMode>("package");
  const [packageManager, setPackageManager] = useState<RegistryPackageManager>("pnpm");
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>();
  const [pendingCopy, setPendingCopy] = useState<string>();
  const copyRequestRef = useRef(0);
  const plan =
    mode === "package"
      ? getCompositionInstallPlan(slug, "package")
      : getCompositionInstallPlan(slug, "copy-source");
  const command = getInstallCommand(plan, packageManager);
  const sourceFiles = sources[mode];
  const sourceByDestination = new Map(sourceFiles.map((file) => [file.destinationPath, file]));
  const dependencies = [
    ...plan.dependencies.npm,
    ...plan.dependencies.workspace,
    ...plan.dependencies.peer,
  ];

  async function copyText(key: string, value: string, successMessage: string) {
    const requestId = copyRequestRef.current + 1;
    copyRequestRef.current = requestId;
    setPendingCopy(key);

    try {
      const clipboard = navigator.clipboard as Clipboard | undefined;

      if (!clipboard) {
        throw new Error("Clipboard API unavailable");
      }

      await clipboard.writeText(value);

      if (copyRequestRef.current === requestId) {
        setCopyFeedback({ key, message: successMessage, success: true });
      }
    } catch {
      if (copyRequestRef.current === requestId) {
        setCopyFeedback({
          key,
          message: "Copy failed. Select the text and copy it manually.",
          success: false,
        });
      }
    } finally {
      if (copyRequestRef.current === requestId) {
        setPendingCopy(undefined);
      }
    }
  }

  function resetCopyFeedback() {
    copyRequestRef.current += 1;
    setPendingCopy(undefined);
    setCopyFeedback(undefined);
  }

  return (
    <section className="composition-delivery" aria-labelledby="delivery-title">
      <div className="composition-delivery-heading">
        <div>
          <p className="eyebrow">Delivery contract</p>
          <h2 id="delivery-title">Install it</h2>
        </div>
        <div className="composition-delivery-tabs" aria-label="Delivery mode">
          {(["package", "copy-source"] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              aria-pressed={mode === nextMode}
              onClick={() => {
                setMode(nextMode);
                resetCopyFeedback();
              }}
            >
              {nextMode === "package" ? "Package" : "Copy source"}
            </button>
          ))}
        </div>
      </div>

      <div className="composition-delivery-grid">
        <div className="composition-command-panel">
          <div className="composition-package-managers" aria-label="Package manager">
            {registryPackageManagers.map((manager) => (
              <button
                key={manager}
                type="button"
                aria-pressed={packageManager === manager}
                onClick={() => {
                  setPackageManager(manager);
                  resetCopyFeedback();
                }}
              >
                {manager}
              </button>
            ))}
          </div>
          <div className="composition-command-block">
            <pre aria-label="Install command">
              <code>{command}</code>
            </pre>
            <button
              aria-label="Copy install command"
              className="composition-copy-button"
              data-success={
                copyFeedback?.key === "command" && copyFeedback.success ? true : undefined
              }
              disabled={pendingCopy === "command"}
              onClick={() => {
                void copyText("command", command, "Install command copied.");
              }}
              type="button"
            >
              {copyFeedback?.key === "command" && copyFeedback.success ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              <span>{pendingCopy === "command" ? "Copying" : "Copy command"}</span>
            </button>
          </div>
          <p>
            {mode === "package"
              ? "The composition imports stable APIs from easecraft."
              : "The plan includes every transitive Easecraft source file required to compile."}
          </p>
          <p
            aria-atomic="true"
            aria-live="polite"
            className="composition-copy-status"
            data-error={copyFeedback && !copyFeedback.success ? true : undefined}
            role="status"
          >
            {copyFeedback?.message ?? ""}
          </p>
        </div>

        <div className="composition-plan-panel">
          <div className="composition-plan-heading">
            <h3>Files / {plan.files.length.toString().padStart(2, "0")}</h3>
            <button
              className="composition-copy-button"
              data-success={copyFeedback?.key === "all" && copyFeedback.success ? true : undefined}
              disabled={pendingCopy === "all" || sourceFiles.length === 0}
              onClick={() => {
                void copyText(
                  "all",
                  serializeCompositionSources(sourceFiles),
                  `${sourceFiles.length.toString()} files copied.`,
                );
              }}
              type="button"
            >
              {copyFeedback?.key === "all" && copyFeedback.success ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              <span>{pendingCopy === "all" ? "Copying" : "Copy all"}</span>
            </button>
          </div>
          <ol className="composition-file-list">
            {plan.files.map((file) => {
              const source = sourceByDestination.get(file.destinationPath);
              const copyKey = `file:${file.destinationPath}`;

              return (
                <li key={file.destinationPath}>
                  <span>{file.role}</span>
                  <code>{file.destinationPath}</code>
                  <button
                    aria-label={`Copy ${file.destinationPath}`}
                    className="composition-copy-button composition-file-copy-button"
                    data-success={
                      copyFeedback?.key === copyKey && copyFeedback.success ? true : undefined
                    }
                    disabled={pendingCopy === copyKey || !source}
                    onClick={() => {
                      if (source) {
                        void copyText(copyKey, source.content, `${file.destinationPath} copied.`);
                      }
                    }}
                    title={`Copy ${file.destinationPath}`}
                    type="button"
                  >
                    {copyFeedback?.key === copyKey && copyFeedback.success ? (
                      <Check aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="composition-plan-panel">
          <h3>Dependencies / {dependencies.length.toString().padStart(2, "0")}</h3>
          <dl className="composition-dependency-list">
            {dependencies.map((dependency) => (
              <div key={`${dependency.type}:${dependency.name}`}>
                <dt>{dependency.name}</dt>
                <dd>
                  {dependency.type} / {dependency.version}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
