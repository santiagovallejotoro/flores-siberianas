import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import UbicacionesEditor from "@/components/Farm/UbicacionesEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

export const metadata: Metadata = {
  title: "Ubicaciones | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function UbicacionesPage() {
  const supabase = await createSSRSassClient();
  const initialUbicaciones = await listUbicaciones(supabase.getSupabaseClient());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Ubicaciones
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Finca o predio contiguo. Varias variedades y calendarios; costos
          separados por finca.
        </p>
      </div>

      <CatalogHelp
        why="Cada registro = una finca o un predio de producción junto, sin detallar cada cama. Otra finca o predio distinto = otra fila. Costos y cosechas por finca."
        example="Finca A y finca B: dos ubicaciones. En una sola finca pueden mezclarse varias variedades."
      />

      <UbicacionesEditor initialUbicaciones={initialUbicaciones} />
    </div>
  );
}
