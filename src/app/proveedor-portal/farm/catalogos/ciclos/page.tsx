import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listVariedades } from "@/lib/farm/variedades";
import { listCiclosByVariedad } from "@/lib/farm/ciclos";
import CiclosProduccionEditor from "@/components/Farm/CiclosProduccionEditor";

export const metadata: Metadata = {
  title: "Ciclos de Producción | Portal Proveedor",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ variedad?: string }>;
}

export default async function CiclosProduccionPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const variedades = await listVariedades(client);
  const initialVariedadId =
    params.variedad && variedades.some((v) => v.id === params.variedad)
      ? params.variedad
      : null;
  const initialCiclos = initialVariedadId
    ? await listCiclosByVariedad(client, initialVariedadId)
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Ciclos de Producción
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Plantillas de cortes y porcentajes por variedad. Genera la
          distribución bell-curve a partir del ciclo y la semana de inicio de
          corte, y ajústala manualmente si lo necesitas.
        </p>
      </div>

      <CiclosProduccionEditor
        variedades={variedades}
        initialVariedadId={initialVariedadId}
        initialCiclos={initialCiclos}
      />
    </div>
  );
}
