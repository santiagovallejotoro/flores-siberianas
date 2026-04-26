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
  const isAuthPage   = pathname.startsWith("/auth");
  const isPortalPage = pathname.startsWith("/proveedor-portal");
  const showChrome   = !isAuthPage && !isPortalPage;
  return (
    <Providers>
      <div className="isolate">
        {showChrome && <Header />}
        <main>{children}</main>
        {showChrome && <Footer />}
      </div>
      {showChrome && (
        <ScrollToTop position={pathname === "/proveedores" ? "left" : "right"} />
      )}
    </Providers>
  );
}
