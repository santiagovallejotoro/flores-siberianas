const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.floressiberianas.com";
const siteUrl = baseUrl.replace(/\/$/, "");
const logoUrl = `${siteUrl}/images/logo/logo-2.svg`;

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Flores Siberianas",
  url: siteUrl,
  logo: logoUrl,
  description:
    "High-quality Colombian hydrangeas from Carmen de Viboral. 12+ years of excellence, exporting to 30+ countries, 365 days a year.",
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Flores Siberianas",
  url: siteUrl,
  description:
    "Expertise from the Land. Quality for the World. Premium Colombian hydrangeas for global markets.",
  publisher: {
    "@type": "Organization",
    name: "Flores Siberianas",
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [organization, website],
};

export default function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
