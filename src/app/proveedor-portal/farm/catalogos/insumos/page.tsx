import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listInsumos } from "@/lib/farm/insumos";
import InsumosEditor from "@/components/Farm/InsumosEditor";
import CatalogHelp from "@/components/Onboarding/CatalogHelp";

export const metadata: Metadata = {
  title: "Insumos | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function InsumosPage() {
  const supabase = await createSSRSassClient();
  const initialInsumos = await listInsumos(supabase.getSupabaseClient());

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-white">Insumos</h1>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Cataloga los materiales e insumos que usas en tu finca: fertilizantes,
          pesticidas, sustratos y más, con precios unitarios y stock mínimo.
        </p>
      </div>

      <CatalogHelp
        why="Fertilizantes, sustratos, pesticidas y materiales — todo lo que usas en la operación. Aquí defines el costo unitario y stock mínimo, datos que alimentan inventario y costos por cultivo."
        example="Triple 15 — kg — $3.200/kg — proveedor La Cosecha — stock mínimo 50 kg."
      />

      <InsumosEditor initialInsumos={initialInsumos} />
    </div>
  );
}
