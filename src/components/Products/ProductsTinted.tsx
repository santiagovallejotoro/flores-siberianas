"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductsTinted = () => {
  const { t } = useLanguage();
  const { title, intro, readMore, examples } = t.productsPage.tinted;

  return (
    <section className="border-t border-body-color/[.15] bg-muted py-10 dark:border-white/[.15] dark:bg-bg-color-dark md:py-12 lg:py-16">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {title}
          </h2>
          <p className="mb-6 text-base leading-relaxed text-body-color dark:text-body-color-dark">
            {intro}
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-base font-medium text-primary-600 hover:text-primary-500 dark:text-primary-300 dark:hover:text-primary-400"
          >
            {readMore}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3l7 7-7 7" />
            </svg>
          </a>
          <div className="mt-8 flex flex-wrap gap-3">
            {examples.map((name, index) => (
              <span
                key={index}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-body-color dark:border-white/10 dark:bg-white/5 dark:text-body-color-dark"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsTinted;
