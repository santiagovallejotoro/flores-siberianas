import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technology | Flores Siberianas",
  description: "A Digital Ecosystem for the Floral Supply Chain - Customer portals, supplier dashboards, and market intelligence.",
};

const TechnologyPage = () => {
  return (
    <>
      <section className="pt-[150px] pb-[120px]">
        <div className="container">
          <div className="border-b border-body-color/[.15] pb-16 dark:border-white/[.15] md:pb-20 lg:pb-28">
            <div className="-mx-4 flex flex-wrap">
              <div className="w-full px-4">
                <h1 className="mb-5 text-3xl font-bold text-black dark:text-white sm:text-4xl">
                  Technology & Tools
                </h1>
                <p className="text-base text-body-color">
                  Technology page coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TechnologyPage;
