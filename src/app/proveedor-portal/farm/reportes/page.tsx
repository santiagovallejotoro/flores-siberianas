import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import ReportesViewer from "@/components/Farm/ReportesViewer";

export const metadata: Metadata = {
  title: "Reportes | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function ReportesPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const [ubicaciones, variedades] = await Promise.all([
    listUbicaciones(client),
    listVariedades(client),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Reportes</h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Producción, costos y mano de obra por semana y cultivo.
        </p>
      </div>

      <ReportesViewer
        initialUbicaciones={ubicaciones}
        initialVariedades={variedades}
      />
    </div>
  );
}
