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
  const isAuthPage = pathname.startsWith("/auth");
  return (
    <Providers>
      <div className="isolate">
        {!isAuthPage && <Header />}
        <main>{children}</main>
        {!isAuthPage && <Footer />}
      </div>
      {!isAuthPage && (
        <ScrollToTop position={pathname === "/proveedores" ? "left" : "right"} />
      )}
    </Providers>
  );
}
