import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSSRSassClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard | Portal Proveedor",
  description:
    "Dashboard del portal de proveedores de Flores Siberianas. Resumen de tu finca y operación.",
  robots: { index: false, follow: false },
};

export default async function ProveedorPortalDashboard() {
  const supabase = await createSSRSassClient();
  const {
    data: { user },
  } = await supabase.getSupabaseClient().auth.getUser();

  if (!user) {
    redirect("/auth/proveedores/login");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Resumen de tu finca y operación
        </p>
      </div>

      {/* Empty stats skeleton — fill in once metrics queries are wired */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Cultivos activos", "Producción del mes", "Costos del mes", "Próxima cosecha"].map(
          (label) => (
            <div
              key={label}
              className="rounded-xl border border-stroke bg-white p-5 dark:border-strokedark dark:bg-dark"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-body-color/70 dark:text-body-color-dark/60">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-body-color/30 dark:text-body-color-dark/30">
                —
              </p>
            </div>
          ),
        )}
      </div>

      <div className="mt-8 rounded-xl border border-dashed border-stroke bg-white/50 p-10 text-center dark:border-strokedark dark:bg-dark/40">
        <p className="text-sm text-body-color dark:text-body-color-dark">
          Las estadísticas de tu finca aparecerán aquí.
        </p>
      </div>
    </div>
  );
}
