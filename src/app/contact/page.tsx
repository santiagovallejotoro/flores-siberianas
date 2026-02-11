import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import ContactFAQ from "@/components/Contact/ContactFAQ";
import ContactHero from "@/components/Contact/ContactHero";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Flores Siberianas",
  description:
    "Get in touch with Flores Siberianas. Optimize your floral supply—our team helps you find the perfect solution for your market.",
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
