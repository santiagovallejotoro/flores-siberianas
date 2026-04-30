import LegalDocument from "@/components/Legal/LegalDocument";
import type { Metadata } from "next";

const title = "Terms of Service | Flores Siberianas";
const description =
  "Terms of Service for Flores Sibesianas SAS websites and portals, including client and supplier tools.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terminos" },
  openGraph: {
    title,
    description,
    url: "/terminos",
    type: "website",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
  return <LegalDocument kind="terms" />;
}
