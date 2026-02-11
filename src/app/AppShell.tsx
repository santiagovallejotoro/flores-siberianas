"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Providers } from "./providers";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="isolate">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
      <ScrollToTop />
    </Providers>
  );
}
