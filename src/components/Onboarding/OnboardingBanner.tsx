"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OnboardingStatus } from "@/lib/farm/onboarding";

const DISMISSED_KEY = "fs_onboarding_banner_dismissed_session";

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

export default function OnboardingBanner({
  status,
}: {
  status: OnboardingStatus;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(
      typeof window !== "undefined" &&
        window.sessionStorage.getItem(DISMISSED_KEY) === "1",
    );
  }, []);

  if (status.isComplete || dismissed) return null;

  const remaining =
    Number(!status.configuracionDone) +
    Number(status.clasesCount === 0) +
    Number(status.ubicacionesCount === 0) +
    Number(status.variedadesCount === 0) +
    Number(status.ciclosCount === 0);

  const headline =
    remaining === 1
      ? "Te falta 1 paso para empezar a registrar cultivos."
      : `Te faltan ${remaining} pasos para empezar a registrar cultivos.`;

  function handleDismiss() {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="rounded-xl border border-primary bg-primary-100/40 p-5 dark:border-primary-400/60 dark:bg-primary-500/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-primary-300">
            Primeros pasos
          </p>
          <p className="mt-1 text-base font-semibold text-black dark:text-white">
            {headline}
          </p>
          <p className="mt-0.5 text-sm text-body-color dark:text-body-color-dark">
            Te guiamos en orden: configuración económica, clases, ubicaciones,
            variedades y ciclos de producción.
          </p>
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm font-medium text-body-color hover:bg-gray-50 dark:border-strokedark dark:bg-dark dark:text-body-color-dark dark:hover:bg-white/5"
          >
            Más tarde
          </button>
          <Link
            href="/proveedor-portal/primeros-pasos"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
          >
            Continuar configuración
            <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
