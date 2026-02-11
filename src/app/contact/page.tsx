import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import ContactFAQ from "@/components/Contact/ContactFAQ";
import ContactHero from "@/components/Contact/ContactHero";

import { Metadata } from "next";

const title = "Contact | Flores Siberianas";
const description =
  "Get in touch with Flores Siberianas. Optimize your floral supply—our team helps you find the perfect solution for your market.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title,
    description,
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: ["contact", "Flores Siberianas", "hydrangeas", "flower supply", "export"],
};

const ContactPage = () => {
  return (
    <>
      <ScrollUp />
      <ContactHero />
      <Contact />
      <ContactFAQ />
    </>
  );
};

export default ContactPage;
