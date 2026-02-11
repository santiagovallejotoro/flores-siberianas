import AboutSectionOne from "@/components/About/AboutSectionOne";
import ScrollUp from "@/components/Common/ScrollUp";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import ProductsSection from "@/components/Products";
import UpcomingTools from "@/components/UpcomingTools";
import ContactSection from "@/components/ContactSection";
import { Metadata } from "next";

const title = "Flores Siberianas | Expertise from the Land. Quality for the World.";
const description =
  "High-quality Colombian hydrangeas from Carmen de Viboral. 12+ years of excellence, 30+ countries, 365 days a year. Technology-driven quality you can trust.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: [
    "hydrangeas",
    "Colombian flowers",
    "flower export",
    "Carmen de Viboral",
    "Flores Siberianas",
  ],
};

export default function Home() {
  return (
    <>
      <ScrollUp />
      <Hero />
      <AboutSectionOne />
      <ProductsSection />
      <Features />
      <UpcomingTools />
      <ContactSection />
    </>
  );
}
