import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Costos | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function CostosPage() {
  return (
    <ComingSoon
      title="Costos"
      description="Registra costos de mano de obra, insumos y servicios por cultivo."
    />
  );
}
