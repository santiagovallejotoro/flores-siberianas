import { redirect } from "next/navigation";
import { createSSRSassClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "@/lib/farm/onboarding";

export default async function PrimerosPasosIndex() {
  const supabase = await createSSRSassClient();
  const status = await getOnboardingStatus(supabase.getSupabaseClient());

  if (!status.configuracionDone) {
    redirect("/proveedor-portal/primeros-pasos/configuracion");
  }
  if (status.clasesCount === 0) {
    redirect("/proveedor-portal/primeros-pasos/clases");
  }
  if (status.ubicacionesCount === 0) {
    redirect("/proveedor-portal/primeros-pasos/ubicaciones");
  }
  if (status.variedadesCount === 0) {
    redirect("/proveedor-portal/primeros-pasos/variedades");
  }
  if (status.insumosCount === 0) {
    redirect("/proveedor-portal/primeros-pasos/insumos");
  }
  if (status.actividadesCount === 0) {
    redirect("/proveedor-portal/primeros-pasos/actividades");
  }
  redirect("/proveedor-portal/farm/cultivos");
}
