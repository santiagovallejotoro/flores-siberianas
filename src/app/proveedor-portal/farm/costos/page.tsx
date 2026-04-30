import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listCostos } from "@/lib/farm/costos";
import { listCultivos } from "@/lib/farm/cultivos";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import { listInsumos } from "@/lib/farm/insumos";
import { listConfiguracion, toConfigMap } from "@/lib/farm/configuracion";
import CostosEditor from "@/components/Farm/CostosEditor";

export const metadata: Metadata = {
  title: "Costos | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function CostosPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const now = new Date();
  const fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [costos, cultivos, ubicaciones, variedades, insumos, configVars] =
    await Promise.all([
      listCostos(client, fechaInicio, fechaFin),
      listCultivos(client),
      listUbicaciones(client),
      listVariedades(client),
      listInsumos(client),
      listConfiguracion(client),
    ]);

  const config = toConfigMap(configVars);
  const jornalDia = parseFloat(config["JORNAL_DIA"] ?? "116000") || 116000;
  const horasJornal = parseFloat(config["HORAS_JORNAL"] ?? "8") || 8;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Costos
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Registra costos de mano de obra, insumos y servicios por cultivo.
        </p>
      </div>

      <CostosEditor
        initialCostos={costos}
        cultivos={cultivos}
        ubicaciones={ubicaciones}
        variedades={variedades}
        insumos={insumos}
        jornalDia={jornalDia}
        horasJornal={horasJornal}
        initialFechaInicio={fechaInicio}
        initialFechaFin={fechaFin}
      />
    </div>
  );
}
