"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const ProductsGradesSection = () => {
  const { t } = useLanguage();

  const grades = [
    {
      key: "mini",
      name: t.products.grades.mini.name,
      headSize: t.products.grades.mini.head,
      stemLength: t.products.grades.mini.stem,
      bestFor: t.products.grades.mini.bestFor,
      badge: t.products.grades.mini.badge ?? null,
    },
    {
      key: "select",
      name: t.products.grades.select.name,
      headSize: t.products.grades.select.head,
      stemLength: t.products.grades.select.stem,
      bestFor: t.products.grades.select.bestFor,
      badge: t.products.grades.select.badge ?? null,
    },
    {
      key: "premium",
      name: t.products.grades.premium.name,
      headSize: t.products.grades.premium.head,
      stemLength: t.products.grades.premium.stem,
      bestFor: t.products.grades.premium.bestFor,
      badge: t.products.grades.premium.badge ?? null,
    },
  ];

  const { title, intro } = t.productsPage.gradesSection;

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

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade) => (
            <div
              key={grade.key}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="relative aspect-square w-full bg-gray-100 dark:bg-white/10">
                {grade.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-sm dark:bg-primary-600">
                    {grade.badge}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                  {grade.name}
                </h3>
                <p className="mb-4 text-sm text-body-color dark:text-body-color-dark">
                  Best for: {grade.bestFor}
                </p>
                <div className="mb-4 border-t border-border dark:border-white/10" />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
                      </svg>
                    </span>
                    <span className="text-sm text-body-color dark:text-body-color-dark">Head:</span>
                    <span className="font-semibold text-primary">{grade.headSize}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-500/15 dark:text-secondary-300">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2v20M6 8v8M18 8v8" />
                      </svg>
                    </span>
                    <span className="text-sm text-body-color dark:text-body-color-dark">Stem:</span>
                    <span className="font-semibold text-secondary">{grade.stemLength}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 dark:border-primary-500/20 dark:from-primary-500/10 dark:to-secondary-500/10 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
                {t.products.postHarvest.title}
              </h3>
              <p className="mb-4 text-lg font-semibold text-primary">
                {t.products.postHarvest.vaseLife}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {t.products.postHarvest.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-body-color dark:text-body-color-dark">
                    <svg className="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsGradesSection;
