import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import ClasesEditor from "@/components/Farm/ClasesEditor";

export const metadata: Metadata = {
  title: "Clases de Cultivo | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function ClasesPage() {
  const supabase = await createSSRSassClient();
  const initialClases = await listClases(supabase.getSupabaseClient());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Clases de Cultivo
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Categorías raíz para variedades y actividades — por ejemplo HORTENSIA, ROSA,
          CLAVEL.
        </p>
      </div>

      <ClasesEditor initialClases={initialClases} />
    </div>
  );
}
