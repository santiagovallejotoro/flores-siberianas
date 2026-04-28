import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listInsumos } from "@/lib/farm/insumos";
import InsumosEditor from "@/components/Farm/InsumosEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Insumos | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepInsumos() {
  const supabase = await createSSRSassClient();
  const initialInsumos = await listInsumos(supabase.getSupabaseClient());

  return (
    <StepShell slug="insumos">
      <InsumosEditor initialInsumos={initialInsumos} />
    </StepShell>
  );
}
