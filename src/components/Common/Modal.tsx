"use client";

import { useEffect, useRef } from "react";

export interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Footer slot — typically Cancel + primary action. */
  footer?: React.ReactNode;
  /** Extra width (default: max-w-2xl). */
  size?: "sm" | "md" | "lg";
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-4xl",
};

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.14] via-black/45 to-secondary-500/[0.12] backdrop-blur-[2px] animate-fade-in dark:from-primary-500/10 dark:via-black/55 dark:to-secondary-500/10"
      />

      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className={[
          "relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-primary-100/80 bg-white shadow-2xl ring-1 ring-primary-200/15 animate-slide-up dark:border-primary-500/20 dark:bg-dark dark:ring-primary-500/10",
          "sm:rounded-2xl sm:animate-fade-in",
          sizeClass[size],
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stroke px-5 py-4 dark:border-strokedark sm:px-6">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-black dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-body-color dark:text-body-color-dark">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 rounded-lg p-1.5 text-body-color hover:bg-gray-100 dark:text-body-color-dark dark:hover:bg-white/5"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 flex-col-reverse items-center gap-2 border-t border-stroke bg-gradient-to-r from-gray-50/90 via-primary-100/25 to-secondary-100/30 px-5 py-4 dark:border-strokedark dark:from-white/[0.02] dark:via-primary-500/[0.06] dark:to-secondary-500/[0.06] sm:flex-row sm:items-center sm:justify-center sm:gap-3 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
