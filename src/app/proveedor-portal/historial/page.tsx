import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Historial | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function HistorialPage() {
  return (
    <ComingSoon
      title="Historial de Compras"
      description="Consulta tus órdenes, entregas y pagos."
    />
  );
}
