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
          Lotes, camas e invernaderos de tu finca. Una ubicación puede albergar
          varios cultivos a lo largo del tiempo.
        </p>
      </div>

      <CatalogHelp
        why="Una ubicación es un lote, cama o invernadero físico de tu finca. Una misma ubicación puede albergar varios cultivos a lo largo del tiempo. Sirve para separar costos, producción y rendimientos por área."
        example="Lote 1 — vereda La Esperanza, 1.200 m² — donde alternas hortensias y rosas según la temporada."
      />

      <UbicacionesEditor initialUbicaciones={initialUbicaciones} />
    </div>
  );
}
