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
          Categorías raíz para variedades y actividades — por ejemplo HORTENSIA, ROSA,
          CLAVEL.
        </p>
      </div>

      <CatalogHelp
        why="Las clases son las familias de flores que cultivas — HORTENSIA, ROSA, CLAVEL. Cada variedad pertenece a una clase, y muchas actividades pueden definirse a nivel de clase para que apliquen automáticamente a todas sus variedades."
        example="Si cultivas tres variedades de hortensia (Limelight, Pink Lady, Bobo), todas pertenecen a la clase HORTENSIA y comparten las actividades base."
      />

      <ClasesEditor initialClases={initialClases} />
    </div>
  );
}
