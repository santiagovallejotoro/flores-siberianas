import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listInsumos } from "@/lib/farm/insumos";
import { listMovimientos, listNecesidadCompra } from "@/lib/farm/inventario";
import { listCultivos } from "@/lib/farm/cultivos";
import { listUbicaciones } from "@/lib/farm/ubicaciones";
import { listVariedades } from "@/lib/farm/variedades";
import InventarioEditor from "@/components/Farm/InventarioEditor";

export const metadata: Metadata = {
  title: "Inventario | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function InventarioPage() {
  const supabase = await createSSRSassClient();
  const client = supabase.getSupabaseClient();

  const now = new Date();
  const fechaFin = now.toISOString().slice(0, 10);
  const fechaInicioDate = new Date(now);
  fechaInicioDate.setDate(fechaInicioDate.getDate() - 30);
  const fechaInicio = fechaInicioDate.toISOString().slice(0, 10);

  const [insumos, movimientos, necesidad, cultivos, ubicaciones, variedades] =
    await Promise.all([
      listInsumos(client),
      listMovimientos(client, { fechaInicio, fechaFin }),
      listNecesidadCompra(client),
      listCultivos(client),
      listUbicaciones(client),
      listVariedades(client),
    ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">
          Inventario
        </h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Controla el stock de insumos, registra entradas y salidas, y genera reportes de compra.
        </p>
      </div>

      <InventarioEditor
        insumos={insumos}
        initialMovimientos={movimientos}
        initialNecesidad={necesidad}
        cultivos={cultivos}
        ubicaciones={ubicaciones}
        variedades={variedades}
      />
    </div>
  );
}
