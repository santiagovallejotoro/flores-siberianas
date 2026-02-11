"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductsPackaging = () => {
  const { t } = useLanguage();
  const { title, intro, cards } = t.productsPage.packaging;

  return (
    <section className="border-t border-body-color/[.15] py-10 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
            {intro}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                {card.title}
              </h3>
              <p className="mb-3 text-sm font-medium text-primary">
                {card.stems}
              </p>
              <p className="text-sm text-body-color dark:text-body-color-dark">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsPackaging;
