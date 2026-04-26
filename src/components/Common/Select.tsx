"use client";

import { forwardRef } from "react";

/**
 * Styled select that replaces every bare <select> in the Farm editors.
 *
 * Design rules (Siberian brand):
 *  - Border: stroke → hover primary/40 → focus primary + ring
 *  - Custom teal chevron (hides native arrow via appearance-none)
 *  - Dark-mode aware
 *  - Drop-in replacement: forward all native <select> props
 */

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional label rendered above the select */
  label?: string;
  /** Optional hint rendered below */
  hint?: string;
  /** Extra wrapper className */
  wrapperClassName?: string;
  /** "sm" makes font-size / padding slightly smaller */
  variant?: "sm" | "md";
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      wrapperClassName,
      variant = "md",
      className = "",
      ...props
    },
    ref,
  ) => {
    const padCls =
      variant === "sm"
        ? "py-1.5 pl-2.5 pr-8 text-xs"
        : "py-2 pl-3 pr-9 text-sm";

    const chevronSize = variant === "sm" ? 14 : 16;

    return (
      <div className={wrapperClassName}>
        {label && (
          <label
            htmlFor={props.id}
            className="mb-1.5 block text-xs font-medium text-body-color dark:text-body-color-dark"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            {...props}
            className={[
              /* layout */
              "w-full appearance-none rounded-lg",
              /* colours */
              "border border-stroke bg-white text-black",
              "dark:border-strokedark dark:bg-dark dark:text-white",
              /* spacing – set by padCls */
              padCls,
              /* transitions */
              "transition-colors duration-150",
              /* hover */
              "hover:border-primary/50 dark:hover:border-primary/40",
              /* focus: border + subtle ring */
              "outline-none",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              "dark:focus:ring-primary/15",
              /* disabled */
              "disabled:cursor-not-allowed disabled:opacity-60",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          />

          {/* Custom chevron – primary teal */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-primary dark:text-primary-400"
          >
            <svg
              width={chevronSize}
              height={chevronSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {hint && (
          <p className="mt-1 text-xs text-body-color/60 dark:text-body-color-dark/60">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

export default Select;
