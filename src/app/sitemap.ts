import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.floressiberianas.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/products", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/exports", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/markets", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl.replace(/\/$/, "")}${path || ""}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
