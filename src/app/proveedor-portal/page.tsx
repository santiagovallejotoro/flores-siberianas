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

export default async function ProveedorPortalDashboard() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const now = new Date();
  const defaultTo = isoDateLocal(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultFrom = isoDateLocal(startOfMonth);
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
      />
    </div>
  );
}
