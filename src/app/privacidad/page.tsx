import LegalDocument from "@/components/Legal/LegalDocument";
import type { Metadata } from "next";

const title = "Privacy Policy | Flores Siberianas";
const description =
  "Privacy Policy describing how Flores Sibesianas SAS collects and processes personal data for its websites and portals.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/privacidad" },
  openGraph: {
    title,
    description,
    url: "/privacidad",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  return <LegalDocument kind="privacy" />;
}
