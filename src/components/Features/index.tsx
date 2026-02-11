"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import SingleFeature from "./SingleFeature";

const Features = () => {
  const { t } = useLanguage();
  
  const techFeatures = [
    {
      id: 1,
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="m3.27 6.96 8.73 4.85 8.73-4.85M12 22.08V11.81" />
        </svg>
      ),
      title: t.technology.features.inventory.title,
      paragraph: t.technology.features.inventory.description,
    },
    {
      id: 2,
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
      title: t.technology.features.productionForecast.title,
      paragraph: t.technology.features.productionForecast.description,
    },
    {
      id: 3,
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      title: t.technology.features.traceability.title,
      paragraph: t.technology.features.traceability.description,
    },
    {
      id: 4,
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="3" />
          <circle cx="5" cy="12" r="3" />
          <circle cx="19" cy="12" r="3" />
          <path d="M8.59 10.59 12 12l3.41 1.41" />
          <path d="M12 12v7" />
          <path d="m15.41 10.59 2.83-2.83" />
        </svg>
      ),
      title: t.technology.features.platform.title,
      paragraph: t.technology.features.platform.description,
    },
  ];

  return (
    <>
      <section id="features" className="py-10 md:py-12 lg:py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
              {t.technology.eyebrow}
            </span>
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              {t.technology.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
              {t.technology.intro}
            </p>
          </div>

          <div className="mb-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {techFeatures.map((feature) => (
              <SingleFeature key={feature.id} feature={feature} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
                {t.technology.stats.fulfillment.split(' ')[0]}
              </div>
              <div className="text-sm text-body-color dark:text-body-color-dark">
                {t.technology.stats.fulfillment.split(' ').slice(1).join(' ')}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
                {t.technology.stats.transit.split(' ')[0]}
              </div>
              <div className="text-sm text-body-color dark:text-body-color-dark">
                {t.technology.stats.transit.split(' ').slice(1).join(' ')}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
                {t.technology.stats.traceability.split(' ')[0]}
              </div>
              <div className="text-sm text-body-color dark:text-body-color-dark">
                {t.technology.stats.traceability.split(' ').slice(1).join(' ')}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white p-6 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 text-2xl font-bold text-primary sm:text-3xl">
                {t.technology.stats.monitoring.split(' ')[0]}
              </div>
              <div className="text-sm text-body-color dark:text-body-color-dark">
                {t.technology.stats.monitoring.split(' ').slice(1).join(' ')}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
