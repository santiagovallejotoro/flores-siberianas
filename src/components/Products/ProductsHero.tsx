"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductsHero = () => {
  const { t } = useLanguage();
  const { title, subtitle } = t.productsPage.hero;

  return (
    <section className="relative z-10 overflow-hidden pt-28 pb-10 lg:pt-[150px] md:pb-12 lg:pb-16">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {title}
          </h1>
          <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductsHero;
