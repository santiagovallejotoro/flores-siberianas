import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import { listVariedades } from "@/lib/farm/variedades";
import { listInsumos } from "@/lib/farm/insumos";
import ActividadesEditor from "@/components/Farm/ActividadesEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

export const metadata: Metadata = {
  title: "Actividades | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function ActividadesPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const [clases, variedades, insumos] = await Promise.all([
    listClases(client),
    listVariedades(client),
    listInsumos(client),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Actividades</h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Catálogo de actividades por clase de cultivo o variedad: siembra, riego,
          fertilización, poda, cosecha y empaque.
        </p>
      </div>

      <CatalogHelp
        why="Las actividades son el catálogo de tareas que se repiten en cada cultivo: riego, fertilización, poda, cosecha, empaque. Las defines una vez por clase o por variedad y el sistema las copia automáticamente en cada cultivo nuevo."
        example="Fertilización con Triple 15 — semana 4 — 30 segundos por planta — requiere 5 g de Triple 15 por planta."
      />

      <ActividadesEditor clases={clases} variedades={variedades} insumos={insumos} />
    </div>
  );
}
