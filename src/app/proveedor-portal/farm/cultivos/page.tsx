import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Cultivos | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function CultivosPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-black dark:text-white">Cultivos</h2>
        <p className="mt-1 text-sm text-body-color dark:text-body-color-dark">
          Gestión de cultivos activos, planificados y finalizados
        </p>
      </div>
      <ComingSoon
        title="Gestión de Cultivos"
        description="Aquí podrás crear y gestionar todos tus cultivos, generar ciclos de producción y registrar actividades."
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        }
      />
    </div>
  );
}
