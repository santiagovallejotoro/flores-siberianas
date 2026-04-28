import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import VariedadesEditor from "@/components/Farm/VariedadesEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Variedades | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepVariedades() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const [variedades, clases, ubicaciones] = await Promise.all([
    listVariedades(client),
    listClases(client),
    listUbicaciones(client),
  ]);

  return (
    <StepShell slug="variedades">
      <VariedadesEditor
        initialVariedades={variedades}
        clases={clases}
        ubicaciones={ubicaciones}
      />
    </StepShell>
  );
}
