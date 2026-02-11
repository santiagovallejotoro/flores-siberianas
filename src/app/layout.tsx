import AppShell from "@/app/AppShell";
import JsonLd from "@/app/JsonLd";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "../styles/index.css";

const inter = Inter({ subsets: ["latin"] });

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const defaultTitle = "Flores Siberianas";
const defaultDescription =
  "High-quality Colombian hydrangeas from Carmen de Viboral. 12+ years of excellence, 30+ countries, 365 days a year. Technology-driven quality you can trust.";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: defaultTitle,
    template: "%s | Flores Siberianas",
  },
  description: defaultDescription,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: "website",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "eHGjWZiVcV4MSJ1w23IaUKep4X5r5W4GwIDRTZ2xGwY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className={`bg-background dark:bg-foreground ${inter.className}`}>
        <JsonLd />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

