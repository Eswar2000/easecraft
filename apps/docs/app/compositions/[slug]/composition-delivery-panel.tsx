"use client";

import {
  getCompositionInstallPlan,
  getInstallCommand,
  registryPackageManagers,
  type CompositionSlug,
  type RegistryDeliveryMode,
  type RegistryPackageManager,
} from "easecraft-registry";
import { useState } from "react";

interface CompositionDeliveryPanelProps {
  readonly slug: CompositionSlug;
}

export function CompositionDeliveryPanel({ slug }: CompositionDeliveryPanelProps) {
  const [mode, setMode] = useState<RegistryDeliveryMode>("package");
  const [packageManager, setPackageManager] = useState<RegistryPackageManager>("pnpm");
  const plan =
    mode === "package"
      ? getCompositionInstallPlan(slug, "package")
      : getCompositionInstallPlan(slug, "copy-source");
  const command = getInstallCommand(plan, packageManager);
  const dependencies = [
    ...plan.dependencies.npm,
    ...plan.dependencies.workspace,
    ...plan.dependencies.peer,
  ];

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
                }}
              >
                {manager}
              </button>
            ))}
          </div>
          <pre aria-label="Install command">
            <code>{command}</code>
          </pre>
          <p>
            {mode === "package"
              ? "The composition imports stable APIs from easecraft."
              : "The plan includes every transitive Easecraft source file required to compile."}
          </p>
        </div>

        <div className="composition-plan-panel">
          <h3>Files / {plan.files.length.toString().padStart(2, "0")}</h3>
          <ol className="composition-file-list">
            {plan.files.map((file) => (
              <li key={file.destinationPath}>
                <span>{file.role}</span>
                <code>{file.destinationPath}</code>
              </li>
            ))}
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
