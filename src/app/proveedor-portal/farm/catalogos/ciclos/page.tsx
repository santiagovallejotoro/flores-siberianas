import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listVariedades } from "@/lib/farm/variedades";
import { listCiclosByVariedad } from "@/lib/farm/ciclos";
import CiclosProduccionEditor from "@/components/Farm/CiclosProduccionEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

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
          Plantillas de cortes y porcentajes por variedad. El sistema reparte el corte semana a semana: más
          volumen en las semanas de pico de floración y menos al inicio y al final del ciclo, usando el total
          de semanas y la semana en que empiezas a cortar. Luego puedes ajustar los porcentajes a mano si lo
          necesitas.
        </p>
      </div>

      <CatalogHelp
        why="Los ciclos son la plantilla semanal de cortes para una variedad: cuánta flor cosechas en cada semana del ciclo. El sistema los genera automáticamente al guardar la variedad — pico al medio del ciclo, menos al inicio y al final — y luego puedes ajustar los porcentajes a mano."
        example="Variedad de 6 semanas: 12% sem 1 — 18% sem 2 — 23% sem 3 — 23% sem 4 — 15% sem 5 — 9% sem 6."
      />

      <CiclosProduccionEditor
        variedades={variedades}
        initialVariedadId={initialVariedadId}
        initialCiclos={initialCiclos}
      />
    </div>
  );
}
