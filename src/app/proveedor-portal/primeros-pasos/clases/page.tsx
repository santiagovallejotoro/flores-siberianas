import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import ClasesEditor from "@/components/Farm/ClasesEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Clases | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepClases() {
  const supabase = await createSSRSassClient();
  const initialClases = await listClases(supabase.getSupabaseClient());

  return (
    <StepShell slug="clases">
      <ClasesEditor initialClases={initialClases} />
    </StepShell>
  );
}
