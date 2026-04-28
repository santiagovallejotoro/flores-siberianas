import { Metadata } from "next";
import { createSSRSassClient, getAuthUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mi Perfil | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function PerfilPage() {
  const [{ data: { user } }, supabase] = await Promise.all([
    getAuthUser(),
    createSSRSassClient(),
  ]);

  const client = supabase.getSupabaseClient();

  const { data: proveedor } = user
    ? await client
        .from("proveedores")
        .select("*")
        .eq("id", user.id)
        .single()
    : { data: null };

  const rows = [
    { label: "Correo", value: user?.email },
    proveedor?.tipo_identificacion
      ? {
          label: "Identificación",
          value: `${proveedor.tipo_identificacion} ${proveedor.numero_identificacion ?? ""}`.trim(),
        }
      : null,
    proveedor?.numero_telefono ? { label: "Teléfono", value: proveedor.numero_telefono } : null,
    proveedor?.vereda ? { label: "Vereda", value: proveedor.vereda } : null,
    proveedor?.municipio ? { label: "Municipio", value: proveedor.municipio } : null,
    {
      label: "Miembro desde",
      value: user
        ? new Date(user.created_at).toLocaleDateString("es-CO", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    },
  ].filter(Boolean) as { label: string; value: string | undefined }[];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black dark:text-white">Mi Perfil</h2>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Información de tu cuenta de proveedor
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-dark">
        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {(proveedor?.nombres ?? user?.email ?? "P").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-black dark:text-white">
              {proveedor?.nombres
                ? `${proveedor.nombres}${proveedor.apellidos ? ` ${proveedor.apellidos}` : ""}`
                : user?.email}
            </p>
            <p className="text-xs text-body-color dark:text-body-color-dark">Proveedor</p>
          </div>
        </div>

        {/* Info rows */}
        <dl className="divide-y divide-stroke dark:divide-strokedark">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between py-3 text-sm">
              <dt className="text-body-color dark:text-body-color-dark">{label}</dt>
              <dd className="font-medium text-black dark:text-white">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
