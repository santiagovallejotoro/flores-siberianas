"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import GradeCard from "./GradeCard";
import TintedCard from "./TintedCard";
import { gradeImages } from "./gradeImages";
import { tintedImages } from "./tintedImages";

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
            <GradeCard key={grade.key} grade={grade} images={gradeImages[grade.key] ?? []} />
          ))}
        </div>

        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {t.productsPage.tinted.title}
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base text-body-color dark:text-body-color-dark">
            {t.productsPage.tinted.intro}
          </p>
          <div className="mb-6 flex w-full justify-center">
            <div className="w-full max-w-md">
              <TintedCard images={tintedImages} title={t.productsPage.tinted.title} />
            </div>
          </div>
          <a
            href="#"
            className="mb-4 inline-flex items-center gap-2 text-base font-medium text-primary-600 hover:text-primary-500 dark:text-primary-300 dark:hover:text-primary-400"
          >
            {t.productsPage.tinted.readMore}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 3l7 7-7 7" />
            </svg>
          </a>
          <div className="flex flex-wrap justify-center gap-3">
            {t.productsPage.tinted.examples.map((name, index) => (
              <span
                key={index}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-body-color dark:border-white/10 dark:bg-white/5 dark:text-body-color-dark"
              >
                {name}
              </span>
            ))}
          </div>
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
