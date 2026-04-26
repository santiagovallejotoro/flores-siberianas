import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Reportes | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function ReportesPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black dark:text-white">Reportes</h2>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Producción, costos y mano de obra por semana y cultivo
        </p>
      </div>
      <ComingSoon
        title="Reportes"
        description="Consulta los reportes de producción, costos de insumos y mano de obra filtrados por semana, variedad o ubicación. Exporta a PDF con un clic."
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        }
      />
    </div>
  );
}
