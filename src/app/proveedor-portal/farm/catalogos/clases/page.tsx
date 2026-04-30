import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listClases } from "@/lib/farm/clases";
import ClasesEditor from "@/components/Farm/ClasesEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

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
          Familias de cultivo (HORTENSIA, ROSA, CLAVEL) para agrupar variedades.
        </p>
      </div>

      <CatalogHelp
        why="Agrupa variedades. Actividades a nivel de clase ahorran trabajo; lo que sea distinto en campo lo detallas por variedad."
        example="Hortensias blanca, azul o limón: misma clase HORTENSIA, misma base de actividades."
      />

      <ClasesEditor initialClases={initialClases} />
    </div>
  );
}
