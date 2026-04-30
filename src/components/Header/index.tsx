"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import ThemeToggler from "./ThemeToggler";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import menuData from "./menuData";

// Logo files: save your images in public/images/logo/
// - Light theme: logo-2.svg (or logo-2.png)
// - Dark theme: logo.svg (or logo.png)
// Recommended: 280×60px PNG or SVG, transparent background
const LOGO_LIGHT = "/images/logo/logo-2.svg";
const LOGO_DARK = "/images/logo/logo.svg";

const Header = () => {
  const { t } = useLanguage();
  
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Login Dropdown Desktop
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  const pathname = usePathname();
  const isProveedoresPage = pathname === "/proveedores";
  const isProveedorPortalPage = pathname === "/proveedor-portal";

  // Translation helper for menu items
  const getMenuTitle = (key: string) => {
    const navKeys = t.nav as Record<string, string>;
    return navKeys[key] || key;
  };

  return (
    <>
      <header
        className={`header top-0 left-0 z-40 flex w-full items-center ${
          sticky
            ? "dark:bg-gray-dark dark:shadow-sticky-dark shadow-sticky fixed z-9999 bg-white/80 backdrop-blur-xs transition"
            : "absolute bg-transparent"
        }`}
      >
        <div className="container">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-72 max-w-full px-4 lg:w-48 xl:w-56 xl:mr-12">
              <Link
                href="/"
                className={`header-logo block w-full transition-transform duration-300 ease-out hover:scale-110 ${
                  sticky ? "py-5 lg:py-2" : "py-8"
                }`}
              >
                <Image
                  src={LOGO_LIGHT}
                  alt="Flores Siberianas"
                  width={200}
                  height={44}
                  className="w-full dark:hidden"
                />
                <Image
                  src={LOGO_DARK}
                  alt="Flores Siberianas"
                  width={200}
                  height={44}
                  className="hidden w-full dark:block"
                />
              </Link>
            </div>
            <div className="flex w-full min-w-0 items-center justify-between px-4">
              <div>
                <button
                  onClick={navbarToggleHandler}
                  id="navbarToggler"
                  aria-label="Mobile Menu"
                  className="ring-primary absolute top-1/2 right-4 block translate-y-[-50%] rounded-lg px-3 py-[6px] focus:ring-2 lg:hidden"
                >
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "top-[7px] rotate-45" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "opacity-0" : " "
                    }`}
                  />
                  <span
                    className={`relative my-1.5 block h-0.5 w-[30px] bg-black transition-all duration-300 dark:bg-white ${
                      navbarOpen ? "top-[-8px] -rotate-45" : " "
                    }`}
                  />
                </button>
                <nav
                  id="navbarCollapse"
                  className={`navbar border-body-color/50 dark:border-body-color/20 dark:bg-dark absolute right-0 z-30 w-[250px] rounded border-[.5px] bg-white px-6 py-4 duration-300 lg:visible lg:static lg:w-auto lg:border-none lg:!bg-transparent lg:p-0 lg:opacity-100 ${
                    navbarOpen
                      ? "visibility top-full opacity-100"
                      : "invisible top-[120%] opacity-0"
                  }`}
                >
                  <ul className="block lg:flex lg:space-x-4 xl:space-x-6">
                    {menuData.map((menuItem, index) => (
                      <li key={index} className="group relative">
                        <Link
                          href={menuItem.path}
                          className={`flex py-2 text-[15px] lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 lg:text-[17px] ${
                            pathname === menuItem.path
                              ? "text-primary dark:text-primary-300"
                              : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-primary-300"
                          }`}
                          onClick={() => setNavbarOpen(false)}
                        >
                          {getMenuTitle(menuItem.title)}
                        </Link>
                      </li>
                    ))}

                  </ul>
                  
                  {/* MOBILE specific PORTALS AND CTA */}
                  <div className="mt-8 border-t border-body-color/20 pt-6 lg:hidden">
                    <p className="mb-4 text-xs tracking-wider uppercase font-semibold text-dark/60 dark:text-white/60">
                      Accesos
                    </p>
                    <div className="flex flex-col space-y-3">
                      <Link
                        href="/client-portal"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary dark:hover:text-white"
                        onClick={() => setNavbarOpen(false)}
                      >
                         <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                         Portal Cliente
                      </Link>
                      <Link
                        href="/proveedor-portal"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary dark:hover:text-white"
                        onClick={() => setNavbarOpen(false)}
                      >
                         <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                         Portal Proveedor
                      </Link>
                    </div>

                    <div className="mt-6 border-t border-body-color/20 pt-6">
                       {isProveedoresPage || isProveedorPortalPage ? (
                            <Link
                                href="/proveedores#registro-proveedor"
                                className="shadow-btn bg-primary hover:bg-primary-600 block w-full rounded-xl px-4 py-3 text-center text-base font-semibold text-white transition duration-300"
                                onClick={() => setNavbarOpen(false)}
                            >
                                Vender
                            </Link>
                       ) : (
                            <Link
                                href="/contact"
                                className="shadow-btn bg-primary hover:bg-primary-600 block w-full rounded-xl px-4 py-3 text-center text-base font-semibold text-white transition duration-300"
                                onClick={() => setNavbarOpen(false)}
                            >
                                {t.common.getQuote || "Obtener cotización"}
                            </Link>
                       )}
                    </div>
                  </div>
                </nav>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-3 pr-16 lg:ml-8 lg:pr-0 xl:ml-12">
                {/* LOGIN DROPDOWN (Desktop only) */}
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-semibold text-dark transition hover:text-primary dark:text-white dark:hover:text-primary-300"
                  >
                    <span>Acceder</span>
                    <svg width="12" height="12" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${loginDropdownOpen ? "rotate-180" : ""}`}>
                        <path d="M7.81602 9.97495C7.68477 9.97495 7.57539 9.9312 7.46602 9.8437L2.43477 4.89995C2.23789 4.70308 2.23789 4.39683 2.43477 4.19995C2.63164 4.00308 2.93789 4.00308 3.13477 4.19995L7.81602 8.77183L12.4973 4.1562C12.6941 3.95933 13.0004 3.95933 13.1973 4.1562C13.3941 4.35308 13.3941 4.65933 13.1973 4.8562L8.16601 9.79995C8.05664 9.90933 7.94727 9.97495 7.81602 9.97495Z" fill="currentColor"/>
                    </svg>
                  </button>
                  
                  {loginDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-[220px] rounded-xl border border-body-color/10 bg-white p-3 shadow-lg dark:border-white/10 dark:bg-dark">
                      <Link
                        href="/client-portal"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-body-color transition hover:bg-primary/5 hover:text-primary dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                        onClick={() => setLoginDropdownOpen(false)}
                      >
                         <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Portal Cliente
                      </Link>
                      <Link
                        href="/proveedor-portal"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-body-color transition hover:bg-primary/5 hover:text-primary dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                        onClick={() => setLoginDropdownOpen(false)}
                      >
                         <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        Portal Proveedor
                      </Link>
                    </div>
                  )}
                </div>

                {/* DYNAMIC PRIMARY CTA (Desktop only) */}
                {isProveedoresPage || isProveedorPortalPage ? (
                   <Link
                    href="/proveedores#registro-proveedor"
                    className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary-600 hidden rounded-lg px-6 py-2.5 text-[15px] font-semibold text-white transition duration-300 xl:block"
                   >
                     Vender
                   </Link>
                ) : (
                    <Link
                    href="/contact"
                    className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary-600 hidden rounded-lg px-6 py-2.5 text-[15px] font-semibold text-white transition duration-300 xl:block"
                    >
                    {t?.common?.getQuote || "Obtener cotización"}
                    </Link>
                )}

                <LanguageSelector />
                <ThemeToggler />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
