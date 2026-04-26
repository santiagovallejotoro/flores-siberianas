import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSSRSassClient } from "@/lib/supabase/server";
import ProveedorLogoutButton from "@/components/ProveedorPortal/LogoutButton";

export const metadata: Metadata = {
  title: "Portal Proveedor | Flores Siberianas",
  description:
    "Portal de proveedores de Flores Siberianas. Gestiona tu información, historial y herramientas de cultivo.",
  robots: { index: false, follow: false },
};

export default async function ProveedorPortalPage() {
  const supabase = await createSSRSassClient();
  const {
    data: { user },
  } = await supabase.getSupabaseClient().auth.getUser();

  if (!user) {
    redirect("/auth/proveedores/login");
  }

  const { data: proveedor } = await supabase
    .getSupabaseClient()
    .from("proveedores")
    .select("*")
    .eq("id", user.id)
    .single();

  const displayName =
    proveedor?.nombres && proveedor?.apellidos
      ? `${proveedor.nombres} ${proveedor.apellidos}`
      : proveedor?.nombres ?? user.email;

  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
                Portal Proveedor
              </h1>
              <p className="mt-2 text-body-color dark:text-body-color-dark">
                Bienvenido,{" "}
                <span className="font-medium text-primary">{displayName}</span>
              </p>
            </div>
            <ProveedorLogoutButton />
          </div>

          {/* Placeholder panels */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                title: "Disponibilidad",
                description: "Registra y actualiza tu disponibilidad de flores.",
                icon: (
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm1-13h-2v6l5.25 3.15.75-1.23-4-2.37V7z" />
                ),
              },
              {
                title: "Historial de compras",
                description: "Consulta tus órdenes e historial de pagos.",
                icon: (
                  <>
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </>
                ),
              },
              {
                title: "Inspecciones de calidad",
                description: "Revisa los informes de calidad de tus envíos.",
                icon: (
                  <polyline points="20 6 9 17 4 12" />
                ),
              },
              {
                title: "Planificación",
                description: "Herramientas de pronóstico y producción.",
                icon: (
                  <>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </>
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-dark"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-500/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    {card.icon}
                  </svg>
                </div>
                <h3 className="mb-1 font-semibold text-black dark:text-white">
                  {card.title}
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  {card.description}
                </p>
                <span className="mt-3 inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary dark:bg-primary-500/10 dark:text-primary-300">
                  Próximamente
                </span>
              </div>
            ))}
          </div>

          {/* Account info */}
          <div className="mt-10 rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-dark">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
              Mi cuenta
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
                <span className="text-body-color dark:text-body-color-dark">
                  Correo
                </span>
                <span className="font-medium text-black dark:text-white">
                  {user.email}
                </span>
              </div>
              {proveedor?.tipo_identificacion && (
                <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
                  <span className="text-body-color dark:text-body-color-dark">
                    Identificación
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {proveedor.tipo_identificacion} {proveedor.numero_identificacion}
                  </span>
                </div>
              )}
              {proveedor?.numero_telefono && (
                <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
                  <span className="text-body-color dark:text-body-color-dark">
                    Teléfono
                  </span>
                  <span className="font-medium text-black dark:text-white">
                    {proveedor.numero_telefono}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-body-color dark:text-body-color-dark">
                  Miembro desde
                </span>
                <span className="font-medium text-black dark:text-white">
                  {new Date(user.created_at).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
