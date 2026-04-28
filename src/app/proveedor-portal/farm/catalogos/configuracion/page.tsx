import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import {
  listConfiguracion,
  defaultConfigRows,
  upsertConfigBatch,
} from "@/lib/farm/configuracion";
import ConfiguracionEditor from "@/components/Farm/ConfiguracionEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

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

      <CatalogHelp
        why="Estos parámetros — la tasa de cambio del dólar, el SMMLV y el valor del jornal — son la base para que el sistema calcule costos de mano de obra, insumos y reportes financieros en toda la finca."
        example="Si subes el jornal de $65.000 a $70.000, el costo estimado de cada actividad se ajusta automáticamente en todos los cultivos."
      />

      <ConfiguracionEditor initial={rows} />
    </div>
  );
}
