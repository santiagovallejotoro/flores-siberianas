"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductsColors = () => {
  const { t } = useLanguage();
  const { title, subtitle, items } = t.productsPage.colors;

  return (
    <section className="border-t border-body-color/[.15] py-10 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="h-16 w-16 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 dark:border-dark dark:ring-white/10 md:h-20 md:w-20"
                style={{ backgroundColor: item.hex }}
              />
              <span className="text-sm font-medium text-black dark:text-white">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsColors;
