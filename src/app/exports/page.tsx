import ScrollUp from "@/components/Common/ScrollUp";
import ExportsContent from "@/components/Exports/ExportsContent";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Export & Markets | Flores Siberianas",
  description:
    "Flores Siberianas exports premium hydrangeas to over 30 countries, with a primary focus on Europe, Asia, and Russia.",
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
