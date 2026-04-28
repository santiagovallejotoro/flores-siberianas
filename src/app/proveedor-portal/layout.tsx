import { redirect } from "next/navigation";
import { createSSRSassClient, getAuthUser } from "@/lib/supabase/server";
import PortalShell from "@/components/ProveedorPortal/PortalShell";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ProveedorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ data: { user } }, supabase] = await Promise.all([
    getAuthUser(),
    createSSRSassClient(),
  ]);

  if (!user) {
    redirect("/auth/proveedores/login");
  }

  const client = supabase.getSupabaseClient();

  const [{ data: proveedor }, { count: cultivosCount }] = await Promise.all([
    client
      .from("proveedores")
      .select(
        "nombres, apellidos, numero_telefono, tipo_identificacion, numero_identificacion, correo",
      )
      .eq("id", user.id)
      .single(),
    client.from("cultivos").select("*", { count: "exact", head: true }),
  ]);

  // Gate: require all mandatory profile fields before portal access
  const profileComplete =
    proveedor?.nombres &&
    proveedor?.apellidos &&
    proveedor?.tipo_identificacion &&
    proveedor?.numero_identificacion &&
    proveedor?.numero_telefono;

  if (!profileComplete) {
    redirect("/auth/proveedores/completar-perfil");
  }

  const displayName =
    proveedor?.nombres && proveedor?.apellidos
      ? `${proveedor.nombres} ${proveedor.apellidos}`
      : proveedor?.nombres ?? user.email ?? "Proveedor";

  const memberDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <PortalShell
      displayName={displayName}
      email={user.email ?? ""}
      memberDays={memberDays}
      proveedor={proveedor}
      cultivosCount={cultivosCount ?? 0}
    >
      {children}
    </PortalShell>
  );
}
