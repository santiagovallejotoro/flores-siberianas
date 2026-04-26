import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Producción | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function ProduccionPage() {
  return (
    <ComingSoon
      title="Producción"
      description="Registra cosechas, pérdidas y precios de venta por cultivo."
    />
  );
}
