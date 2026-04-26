import { Metadata } from "next";
import ComingSoon from "@/components/ProveedorPortal/ComingSoon";

export const metadata: Metadata = {
  title: "Disponibilidad | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default function DisponibilidadPage() {
  return (
    <ComingSoon
      title="Disponibilidad"
      description="Registra y actualiza tu disponibilidad de flores para Flores Siberianas."
    />
  );
}
