"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

  const usePathName = usePathname();
  
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
            <div className="w-72 max-w-full px-4 xl:mr-12">
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
            <div className="flex w-full items-center justify-between px-4">
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
                  <ul className="block lg:flex lg:space-x-12">
                    {menuData.map((menuItem, index) => (
                      <li key={index} className="group relative">
                        <Link
                          href={menuItem.path}
                          className={`flex py-2 text-[15px] lg:mr-0 lg:inline-flex lg:px-0 lg:py-6 lg:text-[17px] ${
                            usePathName === menuItem.path
                              ? "text-primary dark:text-primary-300"
                              : "text-dark hover:text-primary dark:text-white/70 dark:hover:text-primary-300"
                          }`}
                        >
                          {getMenuTitle(menuItem.title)}
                        </Link>
                      </li>
                    ))}
                    <li className="lg:hidden">
                      <Link
                        href="/client-portal"
                        className="bg-primary hover:bg-primary-600 mt-2 flex rounded-xl px-4 py-2.5 text-center text-[15px] font-semibold text-white"
                      >
                        {t.common.clientPortal}
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-end gap-3 pr-16 lg:pr-0">
                <Link
                  href="/contact"
                  className="ease-in-up shadow-btn hover:shadow-btn-hover bg-primary hover:bg-primary-600 hidden rounded-lg px-6 py-3 text-base font-semibold text-white transition duration-300 md:block"
                >
                  {t.common.getQuote}
                </Link>
                <LanguageSelector />
                <Link
                  href="/client-portal"
                  className="bg-primary hover:bg-primary-600 hidden rounded-xl px-5 py-2.5 text-base font-semibold text-white transition duration-300 md:flex md:items-center"
                >
                  {t.common.clientPortal}
                </Link>
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
