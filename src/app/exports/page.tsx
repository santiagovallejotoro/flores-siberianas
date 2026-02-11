import ScrollUp from "@/components/Common/ScrollUp";
import ExportsContent from "@/components/Exports/ExportsContent";

import { Metadata } from "next";

const title = "Export & Markets | Flores Siberianas";
const description =
  "Flores Siberianas exports premium hydrangeas to over 30 countries, with a primary focus on Europe, Asia, and Russia.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/exports" },
  openGraph: {
    title,
    description,
    url: "/exports",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: ["flower export", "hydrangeas export", "Colombia", "Europe", "Asia", "Russia"],
};

const ExportsPage = () => {
  return (
    <>
      <ScrollUp />
      <ExportsContent />
    </>
  );
};

export default ExportsPage;
