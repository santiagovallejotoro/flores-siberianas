"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductsFeatures = () => {
  const { t } = useLanguage();
  const features = t.productsPage.features;

  const icons = [
    // Strong Stems - plant/sprout
    <svg key="stems" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8m0 0 4-4m-4 4-4-4" />
      <path d="M12 22v-8m0 0 4 4m-4-4-4 4" />
      <path d="M2 12h8m0 0-4-4m4 4 4-4" />
      <path d="M22 12h-8m0 0 4 4m-4-4 4 4" />
    </svg>,
    // Uniform Heads - ruler
    <svg key="ruler" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 6H3M21 12H3M21 18H3" />
      <path d="M6 3v18M10 3v18M14 3v18M18 3v18" />
    </svg>,
    // 12-15 Day - stopwatch
    <svg key="vase" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>,
    // Export Ready - box
    <svg key="box" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 8.73 4.85 8.73-4.85M12 22.08V11.81" />
    </svg>,
  ];

  return (
    <section className="py-10 md:py-12 lg:py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                {icons[index]}
              </div>
              <h3 className="mb-2 text-lg font-bold text-black dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsFeatures;
