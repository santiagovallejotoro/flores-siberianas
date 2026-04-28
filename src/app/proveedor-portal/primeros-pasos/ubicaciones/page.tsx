import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import UbicacionesEditor from "@/components/Farm/UbicacionesEditor";
import StepShell from "@/components/Onboarding/StepShell";

export const metadata: Metadata = {
  title: "Ubicaciones | Primeros pasos",
  robots: { index: false, follow: false },
};

export default async function StepUbicaciones() {
  const supabase = await createSSRSassClient();
  const initialUbicaciones = await listUbicaciones(supabase.getSupabaseClient());

  return (
    <StepShell slug="ubicaciones">
      <UbicacionesEditor initialUbicaciones={initialUbicaciones} />
    </StepShell>
  );
}
