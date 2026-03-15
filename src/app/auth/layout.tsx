import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

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
      <div className="relative flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 bg-white dark:bg-dark shadow-xl lg:shadow-none">
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

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {children}
        </div>
      </div>

      {/* Right column — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-gradient-to-br from-primary-700 to-primary-500 p-12">
        <div className="max-w-lg">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Colombian Hydrangeas for the World&apos;s Finest Markets
          </h2>
          <p className="mb-10 text-primary-100 text-lg leading-relaxed">
            Access your client portal to manage orders, track shipments, and explore our full catalog of premium hydrangeas.
          </p>

          <div className="space-y-5">
            {[
              {
                title: "12+ Years of Excellence",
                text: "Over a decade of growing and exporting the finest Colombian hydrangeas to 30+ countries.",
              },
              {
                title: "365-Day Supply",
                text: "Year-round availability from the ideal altitude and volcanic soils of Carmen de Viboral.",
              },
              {
                title: "Technology-Driven Quality",
                text: "Data-informed cultivation and post-harvest processes for consistent, reliable quality.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl bg-white/10 p-5 backdrop-blur-sm border border-white/20"
              >
                <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary-400/40 p-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-sm text-primary-100">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
