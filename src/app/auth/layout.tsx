import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import AuthBrandPanel from "./AuthBrandPanel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark">
      {/* Left column — form */}
      <div className="relative flex min-w-0 w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 bg-white dark:bg-dark shadow-xl lg:shadow-none">
        <Link
          href="/"
          className="absolute left-8 top-8 flex items-center gap-2 text-sm text-body-color hover:text-primary transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to site
        </Link>

        {/* Full width on small screens; cap width only when there is room (mobile-first). */}
        <div className="mx-auto w-full min-w-0 max-w-full md:max-w-xl lg:max-w-2xl">
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/images/logo/logo-2.svg"
                alt="Flores Siberianas"
                width={160}
                height={40}
                className="dark:hidden"
                priority
              />
              <Image
                src="/images/logo/logo.svg"
                alt="Flores Siberianas"
                width={160}
                height={40}
                className="hidden dark:block"
                priority
              />
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Right column — brand panel */}
      <AuthBrandPanel />
    </div>
  );
}
