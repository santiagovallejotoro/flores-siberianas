"use client";

import { useEffect, useRef } from "react";

export type ConfirmTone = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneStyles: Record<
  ConfirmTone,
  {
    iconBg: string;
    iconText: string;
    confirmBtn: string;
    icon: React.ReactNode;
  }
> = {
  danger: {
    iconBg: "bg-red-100 dark:bg-red-500/15",
    iconText: "text-red-600 dark:text-red-400",
    confirmBtn:
      "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600",
    icon: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
  },
  warning: {
    iconBg: "bg-amber-100 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-400",
    confirmBtn:
      "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-400 dark:bg-amber-500 dark:hover:bg-amber-600",
    icon: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
  },
  info: {
    iconBg: "bg-primary-100 dark:bg-primary-500/15",
    iconText: "text-primary dark:text-primary-300",
    confirmBtn:
      "bg-primary hover:bg-primary-600 focus-visible:ring-primary dark:bg-primary dark:hover:bg-primary-600",
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
  },
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "info",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const styles = toneStyles[tone];

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Escape closes; autofocus the safe action (cancel)
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby={description ? "confirm-desc" : undefined}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => !busy && onCancel()}
        className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.14] via-black/45 to-secondary-500/[0.12] backdrop-blur-[2px] transition-opacity animate-fade-in dark:from-primary-500/10 dark:via-black/55 dark:to-secondary-500/10"
      />

      {/* Dialog */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-primary-100/80 bg-white shadow-2xl ring-1 ring-primary-200/15 animate-slide-up dark:border-primary-500/20 dark:bg-dark dark:ring-primary-500/10 sm:rounded-2xl sm:animate-fade-in"
        // Stop clicks inside the panel from reaching the backdrop
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
          <div className="flex items-start gap-4">
            <div
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                styles.iconBg,
                styles.iconText,
              ].join(" ")}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {styles.icon}
              </svg>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="confirm-title"
                className="text-base font-semibold text-black dark:text-white sm:text-lg"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="confirm-desc"
                  className="mt-1.5 text-sm leading-relaxed text-body-color dark:text-body-color-dark"
                >
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-stroke bg-gradient-to-r from-gray-50/90 via-primary-100/25 to-secondary-100/30 px-5 py-4 dark:border-strokedark dark:from-white/[0.02] dark:via-primary-500/[0.06] dark:to-secondary-500/[0.06] sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-medium text-body-color transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-strokedark dark:bg-dark dark:text-body-color-dark dark:hover:bg-white/5 sm:w-auto"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto",
              styles.confirmBtn,
            ].join(" ")}
          >
            {busy && (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.25"
                />
                <path
                  d="M22 12a10 10 0 0 1-10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
