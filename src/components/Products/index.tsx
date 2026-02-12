"use client";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import GradeCard from "./GradeCard";
import { gradeImages } from "./gradeImages";

const ProductsSection = () => {
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

  return (
    <section id="products" className="bg-muted py-10 dark:bg-bg-color-dark md:py-12 lg:py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
            {t.products.eyebrow}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {t.products.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
            {t.products.intro}
          </p>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade) => (
            <GradeCard key={grade.key} grade={grade} images={gradeImages[grade.key] ?? []} />
          ))}
        </div>

        <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 dark:border-primary-500/20 dark:from-primary-500/10 dark:to-secondary-500/10 md:p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
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
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 hover:shadow-md"
            >
              {t.products.catalog}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
