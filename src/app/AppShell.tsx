"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { usePathname } from "next/navigation";
import { Providers } from "./providers";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <Providers>
      <div className="isolate">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
      <ScrollToTop position={pathname === "/proveedores" ? "left" : "right"} />
    </Providers>
  );
}
