"use server";

import { createSSRSassClient, getAuthUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface CompleteProfilePayload {
  nombres: string;
  apellidos: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  numero_telefono: string;
}

export async function completeProveedorProfile(
  payload: CompleteProfilePayload,
): Promise<{ error?: string }> {
  const { data: { user } } = await getAuthUser();

  if (!user) {
    redirect("/auth/proveedores/login");
  }

  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const { error } = await client
    .from("proveedores")
    .update({
      nombres: payload.nombres.trim(),
      apellidos: payload.apellidos.trim(),
      tipo_identificacion: payload.tipo_identificacion,
      numero_identificacion: payload.numero_identificacion.trim(),
      numero_telefono: payload.numero_telefono.trim(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: "No se pudo guardar la información. Inténtalo de nuevo." };
  }

  redirect("/proveedor-portal");
}
