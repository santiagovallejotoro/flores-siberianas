import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import {
  listConfiguracion,
  defaultConfigRows,
  upsertConfigBatch,
} from "@/lib/farm/configuracion";
import ConfiguracionEditor from "@/components/Farm/ConfiguracionEditor";

export const metadata: Metadata = {
  title: "Configuración | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function ConfiguracionPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  let rows = await listConfiguracion(client);

  // First visit: seed defaults for any missing variables
  if (rows.length < 4) {
    const existing = new Set(rows.map((r) => r.variable));
    const missing = defaultConfigRows().filter((r) => !existing.has(r.variable));
    if (missing.length > 0) {
      await upsertConfigBatch(client, missing);
      rows = await listConfiguracion(client);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Parámetros económicos que afectan los cálculos de costos de mano de
          obra e insumos en toda la finca.
        </p>
      </div>

      <ConfiguracionEditor initial={rows} />
    </div>
  );
}
