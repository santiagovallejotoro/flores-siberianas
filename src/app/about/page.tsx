import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import OurStory from "@/components/About/OurStory";
import OurTeam from "@/components/About/OurTeam";
import OurValues from "@/components/About/OurValues";
import ScrollUp from "@/components/Common/ScrollUp";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Flores Siberianas",
  description: "Learn about Flores Siberianas - From Carmen de Viboral to the world's finest markets. Over 12 years of expertise in high-quality Colombian hydrangeas.",
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
