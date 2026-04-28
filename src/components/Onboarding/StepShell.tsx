import Link from "next/link";
import { getStep, STEPS, type StepSlug } from "@/lib/onboarding/steps";

interface StepShellProps {
  slug: StepSlug;
  children: React.ReactNode;
}

function ArrowLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default function StepShell({ slug, children }: StepShellProps) {
  const step = getStep(slug);
  const isLast = step.next === "finalizar";

  const prevHref = step.prev
    ? `/proveedor-portal/primeros-pasos/${step.prev}`
    : null;
  const nextHref = isLast
    ? "/proveedor-portal/farm/cultivos"
    : `/proveedor-portal/primeros-pasos/${step.next as StepSlug}`;

  const nextLabel = isLast ? "Terminar y ver mis cultivos" : "Siguiente";
  const skipLabel = step.optional
    ? isLast
      ? "Saltar y terminar"
      : "Saltar este paso"
    : null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary-100 bg-primary-100/30 p-4 dark:border-primary-500/30 dark:bg-primary-500/10">
        <div className="flex items-start gap-2.5 text-primary dark:text-primary-300">
          <InfoIcon />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest">
              ¿Por qué este paso?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-body-color dark:text-body-color-dark">
              {step.why}
            </p>
          </div>
        </div>
      </div>

      {children}

      <nav
        aria-label={`Navegación del paso ${step.number} de ${STEPS.length}`}
        className="flex flex-col-reverse gap-2 border-t border-stroke pt-4 dark:border-strokedark sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          {prevHref && (
            <Link
              href={prevHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-body-color hover:bg-gray-50 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
            >
              <ArrowLeft />
              Atrás
            </Link>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {skipLabel && (
            <Link
              href={nextHref}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-body-color hover:bg-gray-50 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
            >
              {skipLabel}
            </Link>
          )}
          <Link
            href={nextHref}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            {nextLabel}
            <ArrowRight />
          </Link>
        </div>
      </nav>
    </div>
  );
}
