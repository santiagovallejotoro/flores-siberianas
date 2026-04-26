import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { listInsumos } from "@/lib/farm/insumos";
import InsumosEditor from "@/components/Farm/InsumosEditor";

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

      <InsumosEditor initialInsumos={initialInsumos} />
    </div>
  );
}
