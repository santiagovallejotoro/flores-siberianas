"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createSPASassClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

// ── Icons (lucide-style paths, kept inline to avoid an extra dep) ──────────
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const icons = {
  home: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </Icon>
  ),
  farm: (
    <Icon>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Icon>
  ),
  edit: (
    <Icon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </Icon>
  ),
  sprout: (
    <Icon>
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </Icon>
  ),
  receipt: (
    <Icon>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </Icon>
  ),
  package: (
    <Icon>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </Icon>
  ),
  fileText: (
    <Icon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </Icon>
  ),
  mapPin: (
    <Icon>
      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  ),
  flower: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5" />
    </Icon>
  ),
  box: (
    <Icon>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </Icon>
  ),
  listChecks: (
    <Icon>
      <path d="m3 17 2 2 4-4" />
      <path d="m3 7 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </Icon>
  ),
  rotateCw: (
    <Icon>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </Icon>
  ),
  briefcase: (
    <Icon>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Icon>
  ),
  clock: (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  ),
  creditCard: (
    <Icon>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </Icon>
  ),
  check: (
    <Icon>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  ),
  user: (
    <Icon>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  ),
  logOut: (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
  ),
};

// ── Nav structure ──────────────────────────────────────────────────────────
type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  /** “Pronto” pill (used for Comercializadora links still in progress) */
  soon?: boolean;
};

type NavEntry =
  | { kind: "link"; item: NavItem }
  | {
      kind: "group";
      label: string;
      icon: React.ReactNode;
      activePrefix: string;
      children: NavItem[];
    };

interface NavSection {
  title: string;
  entries: NavEntry[];
}

function buildSections(cultivosCount: number): NavSection[] {
  return [
    {
      title: "Principal",
      entries: [
        {
          kind: "link",
          item: { label: "Dashboard", href: "/proveedor-portal", icon: icons.home },
        },
      ],
    },
    {
      title: "Planificación de Cultivo",
      entries: [
        {
          kind: "link",
          item: {
            label: "Reportes",
            href: "/proveedor-portal/farm/reportes",
            icon: icons.fileText,
          },
        },
        {
          kind: "link",
          item: {
            label: "Cultivos",
            href: "/proveedor-portal/farm/cultivos",
            icon: icons.sprout,
            badge: cultivosCount,
          },
        },
        {
          kind: "link",
          item: {
            label: "Producción",
            href: "/proveedor-portal/farm/produccion",
            icon: icons.package,
          },
        },
        {
          kind: "link",
          item: {
            label: "Costos",
            href: "/proveedor-portal/farm/costos",
            icon: icons.receipt,
          },
        },
        {
          kind: "group",
          label: "Configuración",
          icon: icons.farm,
          activePrefix: "/proveedor-portal/farm/catalogos",
          children: [
            {
              label: "Clases de Cultivo",
              href: "/proveedor-portal/farm/catalogos/clases",
              icon: icons.sprout,
            },
            {
              label: "Ubicaciones",
              href: "/proveedor-portal/farm/catalogos/ubicaciones",
              icon: icons.mapPin,
            },
            {
              label: "Variedades",
              href: "/proveedor-portal/farm/catalogos/variedades",
              icon: icons.flower,
            },
            {
              label: "Insumos",
              href: "/proveedor-portal/farm/catalogos/insumos",
              icon: icons.box,
            },
            {
              label: "Actividades",
              href: "/proveedor-portal/farm/catalogos/actividades",
              icon: icons.listChecks,
            },
            {
              label: "Ciclos Producción",
              href: "/proveedor-portal/farm/catalogos/ciclos",
              icon: icons.rotateCw,
            },
          ],
        },
      ],
    },
    {
      title: "Comercializadora",
      entries: [
        {
          kind: "link",
          item: {
            label: "Disponibilidad",
            href: "/proveedor-portal/disponibilidad",
            icon: icons.clock,
            soon: true,
          },
        },
        {
          kind: "link",
          item: {
            label: "Historial",
            href: "/proveedor-portal/historial",
            icon: icons.creditCard,
            soon: true,
          },
        },
        {
          kind: "link",
          item: {
            label: "Inspecciones",
            href: "/proveedor-portal/inspecciones",
            icon: icons.check,
            soon: true,
          },
        },
      ],
    },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/proveedor-portal") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

// ── Reusable sub-pieces ────────────────────────────────────────────────────
function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={[
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300"
          : "text-body-color hover:bg-gray-100 dark:text-body-color-dark dark:hover:bg-white/5",
      ].join(" ")}
    >
      {item.icon}
      <span className="flex-1 truncate">{item.label}</span>
      {item.soon ? (
        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-primary-500/10 dark:text-primary-400">
          Pronto
        </span>
      ) : (
        typeof item.badge === "number" &&
        item.badge > 0 && (
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              active
                ? "bg-primary text-white"
                : "bg-primary-100 text-primary dark:bg-primary-500/15 dark:text-primary-300",
            ].join(" ")}
          >
            {item.badge}
          </span>
        )
      )}
    </Link>
  );
}

function CollapsibleGroup({
  label,
  icon,
  activePrefix,
  children,
  pathname,
  onNavigate,
}: {
  label: string;
  icon: React.ReactNode;
  activePrefix: string;
  children: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  const groupActive = pathname.startsWith(activePrefix);
  const [open, setOpen] = useState(groupActive);

  // Auto-open when navigation lands inside this group
  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={[
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          groupActive
            ? "text-primary dark:text-primary-300"
            : "text-body-color hover:bg-gray-100 dark:text-body-color-dark dark:hover:bg-white/5",
        ].join(" ")}
      >
        {icon}
        <span className="flex-1 truncate text-left">{label}</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="ml-6 mt-0.5 space-y-0.5 border-l border-stroke pl-3 dark:border-strokedark">
          {children.map((child) => (
            <li key={child.href}>
              <NavLink item={child} pathname={pathname} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
interface SidebarProps {
  open: boolean;
  onClose: () => void;
  displayName: string;
  email: string;
  cultivosCount: number;
}

export default function Sidebar({
  open,
  onClose,
  displayName,
  email,
  cultivosCount,
}: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    const client = createSPASassClient();
    await client.logout("/auth/proveedores/login");
  };

  const logo =
    resolvedTheme === "dark" ? "/images/logo/logo.svg" : "/images/logo/logo-2.svg";

  const sections = buildSections(cultivosCount);

  return (
    <aside
      className={[
        "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white dark:bg-dark",
        "border-r border-stroke dark:border-strokedark",
        "transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        "lg:static lg:translate-x-0",
      ].join(" ")}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-stroke px-5 dark:border-strokedark">
        <Link href="/proveedor-portal" onClick={onClose}>
          <Image
            src={logo}
            alt="Flores Siberianas"
            width={160}
            height={36}
            priority
          />
        </Link>
        <button
          className="ml-auto rounded-lg p-1.5 text-body-color hover:bg-gray-100 dark:text-body-color-dark dark:hover:bg-white/5 lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, i) => (
          <div key={section.title} className={i === 0 ? "" : "mt-6"}>
            <div className={`mb-2 flex items-center gap-2 px-1 ${i > 0 ? "border-t border-stroke pt-4 dark:border-strokedark" : ""}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary dark:text-primary-400">
                {section.title}
              </span>
            </div>
            <ul className="space-y-0.5">
              {section.entries.map((entry) => {
                if (entry.kind === "link") {
                  return (
                    <li key={entry.item.href}>
                      <NavLink
                        item={entry.item}
                        pathname={pathname}
                        onNavigate={onClose}
                      />
                    </li>
                  );
                }
                return (
                  <CollapsibleGroup
                    key={entry.label}
                    label={entry.label}
                    icon={entry.icon}
                    activePrefix={entry.activePrefix}
                    pathname={pathname}
                    onNavigate={onClose}
                  >
                    {entry.children}
                  </CollapsibleGroup>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User menu trigger */}
      <div
        ref={userMenuRef}
        className="relative shrink-0 border-t border-stroke px-4 py-3 dark:border-strokedark"
      >
        {userMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-dark">
            <div className="border-b border-stroke px-4 py-3 dark:border-strokedark">
              <p className="text-xs text-body-color dark:text-body-color-dark">
                Sesión iniciada como
              </p>
              <p className="mt-0.5 truncate text-sm font-medium text-black dark:text-white">
                {email}
              </p>
            </div>

            <ul className="py-1.5">
              <li>
                <Link
                  href="/proveedor-portal/perfil"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-body-color transition-colors hover:bg-gray-50 dark:text-body-color-dark dark:hover:bg-white/5"
                >
                  {icons.user}
                  Mi perfil
                </Link>
              </li>
            </ul>

            <div className="border-t border-stroke dark:border-strokedark">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                {icons.logOut}
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary dark:bg-primary-500/15 dark:text-primary-300">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-black dark:text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-body-color dark:text-body-color-dark">
              Proveedor
            </p>
          </div>
          <svg
            className={`h-4 w-4 shrink-0 text-body-color transition-transform dark:text-body-color-dark ${
              userMenuOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
