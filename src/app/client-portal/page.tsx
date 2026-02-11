import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal | Flores Siberianas",
  description: "Sign in to the Flores Siberianas client portal to manage your orders and account.",
};

const inputClass =
  "border-stroke text-body-color focus:border-primary dark:focus:border-primary w-full rounded-lg border bg-[#f8f8f8] px-6 py-3 text-base outline-none transition-all duration-300 dark:border-transparent dark:bg-[#2C303B] dark:text-body-color-dark dark:focus:shadow-none";

export default function ClientPortalPage() {
  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="shadow-three dark:bg-dark mx-auto max-w-[440px] rounded-xl bg-white px-6 py-10 sm:p-12">
              <h1 className="mb-2 text-center text-2xl font-bold text-black dark:text-white sm:text-3xl">
                Client Portal
              </h1>
              <p className="text-body-color mb-8 text-center text-base">
                Sign in to access your portal and advanced features.
              </p>
              <form className="space-y-6">
                <div>
                  <label
                    htmlFor="client-email"
                    className="text-dark mb-2 block text-sm font-medium dark:text-white"
                  >
                    Email
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    name="email"
                    placeholder="you@company.com"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="client-password"
                    className="text-dark mb-2 block text-sm font-medium dark:text-white"
                  >
                    Password
                  </label>
                  <input
                    id="client-password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    className={inputClass}
                    required
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="text-body-color flex cursor-pointer items-center gap-2">
                    <input type="checkbox" name="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
                    Remember me
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 w-full rounded-lg px-6 py-3.5 text-base font-semibold text-white shadow transition duration-300"
                >
                  Sign in
                </button>
              </form>
              <p className="text-body-color mt-6 text-center text-sm">
                Need access?{" "}
                <Link href="/contact" className="text-primary font-medium hover:underline">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
