import AboutSectionOne from "@/components/About/AboutSectionOne";
import ScrollUp from "@/components/Common/ScrollUp";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import ProductsSection from "@/components/Products";
import UpcomingTools from "@/components/UpcomingTools";
import ContactSection from "@/components/ContactSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flores Siberianas | Expertise from the Land. Quality for the World.",
  description: "High-quality Colombian hydrangeas from Carmen de Viboral. 12+ years of excellence, 30+ countries, 365 days a year. Technology-driven quality you can trust.",
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
