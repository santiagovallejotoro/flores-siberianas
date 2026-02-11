import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import OurStory from "@/components/About/OurStory";
import OurTeam from "@/components/About/OurTeam";
import OurValues from "@/components/About/OurValues";
import ScrollUp from "@/components/Common/ScrollUp";

import { Metadata } from "next";

const title = "About | Flores Siberianas";
const description =
  "Learn about Flores Siberianas - From Carmen de Viboral to the world's finest markets. Over 12 years of expertise in high-quality Colombian hydrangeas.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title,
    description,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: ["Flores Siberianas", "Colombian hydrangeas", "Carmen de Viboral", "flower export"],
};

const AboutPage = () => {
  return (
    <>
      <ScrollUp />
      <OurStory />
      <AboutSectionOne showLearnMore={false} />
      <OurTeam />
      <AboutSectionTwo />
      <OurValues />
    </>
  );
};

export default AboutPage;
