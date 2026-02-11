"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const OurValues = () => {
  const { t } = useLanguage();

  const ValueCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
    <div className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-white p-6 transition-shadow duration-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:shadow-primary-900/10">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-all duration-300 group-hover:bg-primary-200 group-hover:scale-110 group-hover:text-secondary-600 dark:bg-primary-500/15 dark:text-primary-300 dark:group-hover:bg-primary-500/25 dark:group-hover:text-secondary-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-black dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-body-color dark:text-body-color-dark">
        {description}
      </p>
    </div>
  );

  return (
    <section className="py-10 md:py-12 lg:py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
            {t.about.values.eyebrow}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {t.about.values.eyebrow}
          </h2>
          <p className="mx-auto max-w-3xl text-base text-body-color dark:text-body-color-dark">
            {t.about.values.title}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <ValueCard
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5-5 10-9 10-14a8 8 0 0 0-16 0c0 5 5 9 10 14z" />
                <path d="M9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" />
              </svg>
            }
            title={t.about.values.items.quality.title}
            description={t.about.values.items.quality.description}
          />
          <ValueCard
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H9L3 12l6 10h6l6-10-6-10z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
            title={t.about.values.items.innovation.title}
            description={t.about.values.items.innovation.description}
          />
          <ValueCard
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22V2c-4 2-8 6-8 10s2 6 8 10zM12 2c4 2 8 6 8 10s-2 6-8 10" />
              </svg>
            }
            title={t.about.values.items.sustainability.title}
            description={t.about.values.items.sustainability.description}
          />
          <ValueCard
            icon={
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            }
            title={t.about.values.items.global.title}
            description={t.about.values.items.global.description}
          />
        </div>
      </div>
    </section>
  );
};

export default OurValues;
