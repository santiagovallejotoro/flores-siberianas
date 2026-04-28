import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import {
  listConfiguracion,
  defaultConfigRows,
  upsertConfigBatch,
} from "@/lib/farm/configuracion";
import ConfiguracionEditor from "@/components/Farm/ConfiguracionEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Configuración | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepConfiguracion() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  let rows = await listConfiguracion(client);
  if (rows.length < 4) {
    const existing = new Set(rows.map((r) => r.variable));
    const missing = defaultConfigRows().filter((r) => !existing.has(r.variable));
    if (missing.length > 0) {
      await upsertConfigBatch(client, missing);
      rows = await listConfiguracion(client);
    }
  }

  return (
    <StepShell slug="configuracion">
      <ConfiguracionEditor initial={rows} />
    </StepShell>
  );
}
