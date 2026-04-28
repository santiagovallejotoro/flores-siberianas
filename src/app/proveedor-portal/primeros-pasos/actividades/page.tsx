import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import { listVariedades } from "@/lib/farm/variedades";
import { listInsumos } from "@/lib/farm/insumos";
import ActividadesEditor from "@/components/Farm/ActividadesEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Actividades | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepActividades() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const [clases, variedades, insumos] = await Promise.all([
    listClases(client),
    listVariedades(client),
    listInsumos(client),
  ]);

  return (
    <StepShell slug="actividades">
      <ActividadesEditor clases={clases} variedades={variedades} insumos={insumos} />
    </StepShell>
  );
}
