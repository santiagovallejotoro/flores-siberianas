"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STEPS, type StepSlug } from "@/lib/onboarding/steps";
import type { OnboardingStatus } from "@/lib/farm/onboarding";

function isStepDone(slug: StepSlug, s: OnboardingStatus): boolean {
  switch (slug) {
    case "configuracion":
      return s.configuracionDone;
    case "clases":
      return s.clasesCount > 0;
    case "ubicaciones":
      return s.ubicacionesCount > 0;
    case "variedades":
      return s.variedadesCount > 0;
    case "insumos":
      return s.insumosCount > 0;
    case "actividades":
      return s.actividadesCount > 0;
  }
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function WizardProgress({ status }: { status: OnboardingStatus }) {
  const pathname = usePathname() ?? "";
  const current =
    STEPS.find((s) => pathname.endsWith("/" + s.slug)) ?? null;

  return (
    <div className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-300">
            Primeros pasos
          </p>
          <h1 className="mt-0.5 text-lg font-bold text-black dark:text-white">
            {current
              ? `Paso ${current.number} de ${STEPS.length} · ${current.label}`
              : "Configuración inicial"}
          </h1>
          <p className="mt-0.5 text-xs text-body-color dark:text-body-color-dark">
            Te guiamos para dejar lista tu finca y empezar a registrar cultivos.
          </p>
        </div>
        <Link
          href="/proveedor-portal/farm"
          className="shrink-0 self-start rounded-lg border border-stroke px-3 py-1.5 text-xs font-medium text-body-color hover:bg-gray-50 dark:border-strokedark dark:text-body-color-dark dark:hover:bg-white/5"
        >
          Salir de la guía
        </Link>
      </div>

      <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STEPS.map((step) => {
          const done = isStepDone(step.slug, status);
          const isCurrent = current?.slug === step.slug;
          return (
            <li key={step.slug}>
              <Link
                href={`/proveedor-portal/primeros-pasos/${step.slug}`}
                className={[
                  "flex h-full flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-center text-[11px] font-medium transition-colors",
                  isCurrent
                    ? "border-primary bg-primary-100 text-primary dark:border-primary-400 dark:bg-primary-500/15 dark:text-primary-300"
                    : done
                      ? "border-stroke bg-white text-body-color hover:border-primary/40 dark:border-strokedark dark:bg-dark dark:text-body-color-dark"
                      : "border-dashed border-stroke bg-white/60 text-body-color/80 hover:border-primary/40 dark:border-strokedark dark:bg-dark/50",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                    done
                      ? "bg-primary text-white"
                      : isCurrent
                        ? "bg-primary-200 text-primary dark:bg-primary-500/30 dark:text-primary-200"
                        : "bg-gray-100 text-body-color dark:bg-white/10 dark:text-body-color-dark",
                  ].join(" ")}
                >
                  {done ? <CheckIcon /> : step.number}
                </span>
                <span className="line-clamp-2 leading-tight">{step.short}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
