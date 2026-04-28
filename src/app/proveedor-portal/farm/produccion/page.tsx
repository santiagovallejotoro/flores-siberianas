import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listProducciones } from "@/lib/farm/produccion";
import { listCultivos } from "@/lib/farm/cultivos";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import { listConfiguracion, toConfigMap } from "@/lib/farm/configuracion";
import ProduccionEditor from "@/components/Farm/ProduccionEditor";

export const metadata: Metadata = {
  title: "Producción | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function ProduccionPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const now = new Date();
  const fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [producciones, cultivos, ubicaciones, variedades, configVars] =
    await Promise.all([
      listProducciones(client, fechaInicio, fechaFin),
      listCultivos(client),
      listUbicaciones(client),
      listVariedades(client),
      listConfiguracion(client),
    ]);

  const config = toConfigMap(configVars);
  const tasaCambio = parseFloat(config["TASA_CAMBIO"] ?? "3600") || 3600;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Producción
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Registra cosechas, pérdidas y precios de venta por cultivo.
        </p>
      </div>

      <ProduccionEditor
        initialProducciones={producciones}
        cultivos={cultivos}
        ubicaciones={ubicaciones}
        variedades={variedades}
        tasaCambio={tasaCambio}
        initialFechaInicio={fechaInicio}
        initialFechaFin={fechaFin}
      />
    </div>
  );
}
