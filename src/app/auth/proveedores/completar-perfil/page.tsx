import { redirect } from "next/navigation";
import { Metadata } from "next";
import { createSSRSassClient, getAuthUser } from "@/lib/supabase/server";
import CompleteProfileForm from "./CompleteProfileForm";

export const metadata: Metadata = {
  title: "Completar perfil | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function CompletarPerfilPage() {
  const [{ data: { user } }, supabase] = await Promise.all([
    getAuthUser(),
    createSSRSassClient(),
  ]);

  if (!user) {
    redirect("/auth/proveedores/login");
  }

  const client = supabase.getSupabaseClient();
  const { data: proveedor } = await client
    .from("proveedores")
    .select("nombres, apellidos, tipo_identificacion, numero_identificacion, numero_telefono")
    .eq("id", user.id)
    .single();

  // If the profile is already complete, send them straight to the portal
  const isComplete =
    proveedor?.nombres &&
    proveedor?.apellidos &&
    proveedor?.tipo_identificacion &&
    proveedor?.numero_identificacion &&
    proveedor?.numero_telefono;

  if (isComplete) {
    redirect("/proveedor-portal");
  }

  // Pre-fill names from Google metadata when available
  const meta = user.user_metadata as Record<string, string> | undefined;
  const googleFullName = meta?.full_name ?? meta?.name ?? "";
  const nameParts = googleFullName.split(" ");
  const initialNombres = proveedor?.nombres ?? nameParts[0] ?? "";
  const initialApellidos = proveedor?.apellidos ?? nameParts.slice(1).join(" ") ?? "";

  return (
    <CompleteProfileForm
      initialNombres={initialNombres}
      initialApellidos={initialApellidos}
    />
  );
}
