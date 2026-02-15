import ScrollUp from "@/components/Common/ScrollUp";
import ProveedoresHero from "@/components/Proveedores/ProveedoresHero";
import ProveedoresBenefits from "@/components/Proveedores/ProveedoresBenefits";
import ProveedoresLogistics from "@/components/Proveedores/ProveedoresLogistics";
import ProveedoresRequirements from "@/components/Proveedores/ProveedoresRequirements";
import ProveedoresQualityGallery from "@/components/Proveedores/ProveedoresQualityGallery";
import ProveedoresLocation from "@/components/Proveedores/ProveedoresLocation";
import ProveedoresVarieties from "@/components/Proveedores/ProveedoresVarieties";
import ProveedoresMarkets from "@/components/Proveedores/ProveedoresMarkets";
import ProveedoresInputAlliances from "@/components/Proveedores/ProveedoresInputAlliances";
import ProveedoresFAQ from "@/components/Proveedores/ProveedoresFAQ";
import ProveedoresForm from "@/components/Proveedores/ProveedoresForm";
import { Metadata } from "next";

const title = "Proveedores | Flores Siberianas";
const description =
  "Únase como proveedor de Flores Siberianas. Buscamos productores de hortensias en el Oriente Antioqueño para alianzas estratégicas. Pagos justos, compra constante y apoyo técnico.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/proveedores" },
  openGraph: {
    title,
    description,
    url: "/proveedores",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: [
    "proveedores hortensias",
    "productores flores Colombia",
    "Oriente Antioqueño",
    "Flores Siberianas",
    "vender hortensias",
  ],
};

export default function ProveedoresPage() {
  return (
    <>
      <ScrollUp />
      <ProveedoresHero />
      <ProveedoresBenefits />
      <ProveedoresLogistics />
      <ProveedoresRequirements />
      <ProveedoresQualityGallery />
      <ProveedoresLocation />
      <ProveedoresVarieties />
      <ProveedoresMarkets />
      <ProveedoresInputAlliances />
      <ProveedoresFAQ />
      <ProveedoresForm />
    </>
  );
}

