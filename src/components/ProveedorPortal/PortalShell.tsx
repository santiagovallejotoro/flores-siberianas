"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ConfirmProvider } from "@/components/Common/ConfirmProvider";

interface PortalShellProps {
  displayName: string;
  email: string;
  memberDays: number;
  proveedor: {
    nombres?: string | null;
    apellidos?: string | null;
    numero_telefono?: string | null;
    tipo_identificacion?: string | null;
    numero_identificacion?: string | null;
    correo?: string | null;
  } | null;
  cultivosCount: number;
  children: React.ReactNode;
}

export default function PortalShell({
  displayName,
  email,
  memberDays,
  proveedor,
  cultivosCount,
  children,
}: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open sidebar by default on desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <ConfirmProvider>
      <div className="flex h-screen overflow-hidden bg-background dark:bg-foreground">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          displayName={displayName}
          email={email}
          cultivosCount={cultivosCount}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar
            displayName={displayName}
            memberDays={memberDays}
            onMenuToggle={() => setSidebarOpen((v) => !v)}
          />
          <main className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
