import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import VariedadesEditor from "@/components/Farm/VariedadesEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

export const metadata: Metadata = {
  title: "Variedades | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function VariedadesPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const [variedades, clases, ubicaciones] = await Promise.all([
    listVariedades(client),
    listClases(client),
    listUbicaciones(client),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Variedades</h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Define las variedades de cada clase de cultivo con su ciclo en semanas,
          rendimiento esperado por planta y ubicación típica.
        </p>
      </div>

      <CatalogHelp
        why="Cada variedad tiene su tiempo de cosecha en semanas, su rendimiento por planta y la semana en que comienzas a cortar. Con esto el sistema arma automáticamente los ciclos de producción y proyecta tus cosechas."
        example="Hortensia Limelight: ciclo de 12 semanas, comienzas a cortar en la semana 8, rinde 6 tallos por planta."
      />

      <VariedadesEditor
        initialVariedades={variedades}
        clases={clases}
        ubicaciones={ubicaciones}
      />
    </div>
  );
}
