import { Metadata } from "next";

const title = "Markets | Flores Siberianas";
const description =
  "Connecting Colombia to the World - Exports to over 30 countries with focus on Europe, Asia, and Russia.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/markets" },
  openGraph: {
    title,
    description,
    url: "/markets",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: ["global markets", "flower export", "hydrangeas", "Colombia"],
};

const MarketsPage = () => {
  return (
    <>
      <section className="pt-[150px] pb-[120px]">
        <div className="container">
          <div className="border-b border-body-color/[.15] pb-16 dark:border-white/[.15] md:pb-20 lg:pb-28">
            <div className="-mx-4 flex flex-wrap">
              <div className="w-full px-4">
                <h1 className="mb-5 text-3xl font-bold text-black dark:text-white sm:text-4xl">
                  Global Markets
                </h1>
                <p className="text-base text-body-color">
                  Markets page coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MarketsPage;
