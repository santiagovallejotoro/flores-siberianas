"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const MARKET_FLAGS = ["🇷🇺", "🇪🇺", "🌏"];

const ExportsContent = () => {
  const { t } = useLanguage();
  const { hero, countries, countriesList, markets, logistics, process, cta } = t.exportsPage;

  return (
    <>
      {/* Hero - same pattern as ProductsHero / ContactHero */}
      <section className="relative z-10 overflow-hidden pt-28 pb-10 md:pb-12 lg:pt-[150px] lg:pb-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
              {hero.eyebrow}
            </span>
            <h1 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              {hero.title}{" "}
              <span className="text-primary-600 dark:text-primary-300">{hero.titleHighlight}</span>
            </h1>
            <p className="text-base text-body-color dark:text-body-color-dark md:text-lg">
              {hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-10 md:py-12 lg:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                <GlobeIcon className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-black dark:text-white sm:text-3xl">
                {countries.heading}
              </span>
            </div>
            <p className="mb-8 text-body-color dark:text-body-color-dark">
              {countries.subtext}
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {countriesList.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm text-black transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-primary-500/20 dark:hover:text-primary-300"
                >
                  {c}
                </span>
              ))}
              <span className="rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-sm font-medium text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                {countries.moreLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Market Details - same card pattern as Products */}
      <section className="border-t border-body-color/[.15] py-10 dark:border-white/[.15] md:py-12 lg:py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              {markets.sectionTitle}{" "}
              <span className="text-primary-600 dark:text-primary-300">{markets.sectionTitleHighlight}</span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
              {markets.sectionSubtitle}
            </p>
          </div>

          <div className="space-y-6">
            {markets.list.map((m, i) => (
              <div
                key={m.region}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <div className="grid lg:grid-cols-3">
                  <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-white md:p-8">
                    <span className="mb-3 block text-4xl">{MARKET_FLAGS[i]}</span>
                    <h3 className="mb-4 text-xl font-bold">{m.region}</h3>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-white/70">Transit</span>
                        <p className="font-semibold">{m.transit}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Vase Life</span>
                        <p className="font-semibold">{m.vaseLife}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 lg:col-span-2 md:p-8">
                    <p className="mb-5 text-body-color dark:text-body-color-dark">
                      {m.description}
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {m.features.map((f) => (
                        <div
                          key={f}
                          className="flex items-center gap-2 text-sm text-black dark:text-white"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-300">
                            <CheckCircleIcon className="h-4 w-4" />
                          </div>
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logistics - light section, same card style as ProductsFeatures */}
      <section className="border-t border-body-color/[.15] py-10 dark:border-white/[.15] md:py-12 lg:py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              {logistics.sectionTitle}{" "}
              <span className="text-primary-600 dark:text-primary-300">{logistics.sectionTitleHighlight}</span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-body-color dark:text-body-color-dark">
              {logistics.sectionSubtitle}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {logistics.list.map((l, idx) => (
              <div
                key={l.title}
                className="rounded-xl border border-border bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                  {idx === 0 && <ShieldIcon className="h-6 w-6" />}
                  {idx === 1 && <ThermometerIcon className="h-6 w-6" />}
                  {idx === 2 && <ClockIcon className="h-6 w-6" />}
                  {idx === 3 && <MapPinIcon className="h-6 w-6" />}
                </div>
                <h3 className="mb-2 text-lg font-bold text-black dark:text-white">
                  {l.title}
                </h3>
                <p className="text-sm text-body-color dark:text-body-color-dark">
                  {l.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="border-t border-body-color/[.15] py-10 dark:border-white/[.15] md:py-12 lg:py-16">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              {process.sectionTitle}{" "}
              <span className="text-primary-600 dark:text-primary-300">{process.sectionTitleHighlight}</span>
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-[10%] right-[10%] top-7 hidden h-0.5 bg-border dark:bg-white/20 md:block" />
            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
              {process.steps.map((s, i) => (
                <div key={i} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-primary-200 bg-primary-50 text-lg font-bold text-primary-600 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-300">
                    {i + 1}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-black dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs text-body-color dark:text-body-color-dark">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA - primary teal only, consistent with brand */}
      <section className="bg-primary-500 py-12 text-center text-white md:py-16">
        <div className="container">
          <PlaneIcon className="mx-auto mb-5 h-12 w-12 text-white/80" />
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-[40px]">
            {cta.title}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-white/80">
            {cta.subtitle}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
          >
            {cta.buttonLabel}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
};

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ThermometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default ExportsContent;
