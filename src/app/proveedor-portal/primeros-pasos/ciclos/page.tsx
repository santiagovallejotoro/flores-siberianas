import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listVariedades } from "@/lib/farm/variedades";
import { listCiclosByVariedad } from "@/lib/farm/ciclos";
import CiclosProduccionEditor from "@/components/Farm/CiclosProduccionEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Ciclos de producción | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepCiclos() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const variedades = await listVariedades(client);
  const initialVariedadId = variedades[0]?.id ?? null;
  const initialCiclos = initialVariedadId
    ? await listCiclosByVariedad(client, initialVariedadId)
    : [];

  return (
    <StepShell slug="ciclos">
      <CiclosProduccionEditor
        variedades={variedades}
        initialVariedadId={initialVariedadId}
        initialCiclos={initialCiclos}
      />
    </StepShell>
  );
}
