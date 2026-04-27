import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listCultivos } from "@/lib/farm/cultivos";
import { listVariedades } from "@/lib/farm/variedades";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listClases } from "@/lib/farm/clases";
import CultivosEditor from "@/components/Farm/CultivosEditor";

export const metadata: Metadata = {
  title: "Cultivos | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function CultivosPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const [cultivos, variedades, ubicaciones, clases] = await Promise.all([
    listCultivos(client),
    listVariedades(client),
    listUbicaciones(client),
    listClases(client),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Cultivos
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Gestión de cultivos activos, planificados y finalizados.
        </p>
      </div>

      <CultivosEditor
        initialCultivos={cultivos}
        variedades={variedades}
        ubicaciones={ubicaciones}
        clases={clases}
      />
    </div>
  );
}
