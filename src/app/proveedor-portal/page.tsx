import { Metadata } from "next";
import { redirect } from "next/navigation";
import ProveedorDashboard from "@/components/ProveedorPortal/ProveedorDashboard";
import { buildDashboardPayload } from "@/lib/farm/dashboard";
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
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    redirect("/auth/proveedores/login");
  }

  const now = new Date();
  const defaultTo = isoDateLocal(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultFrom = isoDateLocal(startOfMonth);
  const defaultFinancialYear = now.getFullYear();

  const initial = await buildDashboardPayload(client, {
    from: defaultFrom,
    to: defaultTo,
    financialYear: defaultFinancialYear,
  });

  return (
    <ProveedorDashboard
      initial={initial}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
      defaultFinancialYear={defaultFinancialYear}
    />
  );
}
