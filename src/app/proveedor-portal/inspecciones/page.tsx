import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Inspecciones | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function InspeccionesPage() {
  return (
    <ComingSoon
      title="Inspecciones de Calidad"
      description="Revisa los informes de calidad de tus envíos."
    />
  );
}
