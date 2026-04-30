import { Metadata } from "next";
import ProveedorDashboard from "@/components/ProveedorPortal/ProveedorDashboard";
import OnboardingBanner from "@/components/Onboarding/OnboardingBanner";
import { buildDashboardPayload } from "@/lib/farm/dashboard";
import { getOnboardingStatus } from "@/lib/farm/onboarding";
import { createSSRSassClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | Portal Proveedor",
  description:
    "Dashboard del portal de proveedores de Flores Siberianas. Resumen de tu finca y operación.",
  robots: { index: false, follow: false },
};

function isoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Último día del mes, `n` meses después del 1.º de `d` (n=0: fin de ese mes; n=4: fin de mes, 4 meses después, p. ej. 1 ene–31 may). */
function lastDayOfMonthAfter(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n + 1, 0);
}

export default async function ProveedorPortalDashboard() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultFrom = isoDateLocal(startOfMonth);
  /** Hasta: último día del mes, 4 meses después del inicio (p. ej. 1 abr–31 ago). */
  const defaultTo = isoDateLocal(lastDayOfMonthAfter(startOfMonth, 4));
  const defaultFinancialYear = now.getFullYear();

  const [initial, onboardingStatus] = await Promise.all([
    buildDashboardPayload(client, {
      from: defaultFrom,
      to: defaultTo,
      financialYear: defaultFinancialYear,
    }),
    getOnboardingStatus(client),
  ]);

  return (
    <div className="space-y-6">
      <OnboardingBanner status={onboardingStatus} />
      <ProveedorDashboard
        initial={initial}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
        defaultFinancialYear={defaultFinancialYear}
        onboardingComplete={onboardingStatus.isComplete}
      />
    </div>
  );
}
