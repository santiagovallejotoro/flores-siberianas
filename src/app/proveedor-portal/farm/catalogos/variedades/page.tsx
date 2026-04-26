import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import VariedadesEditor from "@/components/Farm/VariedadesEditor";

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

      <VariedadesEditor
        initialVariedades={variedades}
        clases={clases}
        ubicaciones={ubicaciones}
      />
    </div>
  );
}
