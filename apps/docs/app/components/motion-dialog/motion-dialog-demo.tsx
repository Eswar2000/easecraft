"use client";

import { MotionDialog, MotionProvider } from "easecraft";
import { useRef, useState } from "react";

type DialogStatus = "Closed" | "Opening" | "Open" | "Closing";

export function MotionDialogDemo() {
  const [dismissible, setDismissible] = useState(true);
  const [open, setOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [status, setStatus] = useState<DialogStatus>("Closed");
  const publishButtonRef = useRef<HTMLButtonElement>(null);

  function setDialogOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    setStatus(nextOpen ? "Opening" : "Closing");
  }

  return (
    <MotionProvider reducedMotion={reducedMotion ? "always" : "never"}>
      <section className="motion-dialog-demo" aria-label="Motion Dialog interactive preview">
        <div className="motion-dialog-controls">
          <span className="dialog-status" role="status" aria-live="polite">
            {status}
          </span>
          <label className="motion-switch">
            <input
              type="checkbox"
              checked={dismissible}
              onChange={(event) => {
                setDismissible(event.currentTarget.checked);
              }}
            />
            <span aria-hidden="true" />
            Dismissible
          </label>
          <label className="motion-switch">
            <input
              type="checkbox"
              checked={reducedMotion}
              onChange={(event) => {
                setReducedMotion(event.currentTarget.checked);
              }}
            />
            <span aria-hidden="true" />
            Reduce motion
          </label>
        </div>
        <div className="motion-dialog-stage">
          <span className="stage-label">Release review / modal flow</span>
          <div className="dialog-launch-copy">
            <span className="dialog-launch-index">05</span>
            <h2>Ready for review</h2>
            <p>Open the release checkpoint before publishing this motion catalog.</p>
          </div>
          <MotionDialog
            closeClassName="motion-dialog-close"
            contentClassName="motion-dialog-content"
            description="Confirm the package, documentation, and accessibility checks before publishing."
            dismissible={dismissible}
            initialFocusRef={publishButtonRef}
            onAfterClose={() => {
              setStatus("Closed");
            }}
            onAfterOpen={() => {
              setStatus("Open");
            }}
            onOpenChange={setDialogOpen}
            open={open}
            overlayClassName="motion-dialog-overlay"
            title="Publish the preview?"
            trigger={
              <button className="dialog-launch-button" type="button">
                Review release
              </button>
            }
          >
            <dl className="dialog-release-checks">
              <div>
                <dt>Package</dt>
                <dd>Built</dd>
              </div>
              <div>
                <dt>Keyboard</dt>
                <dd>Verified</dd>
              </div>
              <div>
                <dt>Motion policy</dt>
                <dd>{reducedMotion ? "Reduced" : "Enabled"}</dd>
              </div>
            </dl>
            <div className="motion-dialog-actions">
              <button
                className="dialog-secondary-action"
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="dialog-primary-action"
                ref={publishButtonRef}
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                }}
              >
                Publish preview
              </button>
            </div>
          </MotionDialog>
        </div>
      </section>
    </MotionProvider>
  );
}
