"use client";

import { useLanguage } from "@/contexts/LanguageContext";

const icons = [
  // People / Customer Portals
  <svg key="people" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>,
  // Bar chart / Supplier Dashboards
  <svg key="chart" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>,
  // Globe / Market Intelligence
  <svg key="globe" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>,
];

const UpcomingTools = () => {
  const { t } = useLanguage();
  const { eyebrow, title, titleHighlight, subtitle, tools } = t.upcomingTools;

  const badgeStyles = [
    "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300", // Coming Soon
    "bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300", // In Development
    "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300", // Planned
  ];

  return (
    <section className="border-t border-body-color/[.15] py-10 dark:border-white/[.15] md:py-12 lg:py-16">
      <div className="container">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
            {eyebrow}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
            {title}{" "}
            <span className="text-primary-600 dark:text-primary-300">{titleHighlight}</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
            {subtitle}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <div
              key={tool.title}
              className="relative rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:shadow-primary-900/10"
            >
              <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                {icons[index]}
              </div>
              <span
                className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-medium ${badgeStyles[index]}`}
              >
                {tool.badge}
              </span>
              <h3 className="mb-2 pr-24 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
                {tool.title}
              </h3>
              <p className="text-base font-medium leading-relaxed text-body-color dark:text-body-color-dark">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingTools;
