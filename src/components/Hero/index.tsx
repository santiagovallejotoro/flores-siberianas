"use client";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

const Hero = () => {
  const { t } = useLanguage();
  
  return (
    <>
      <section
        id="home"
        className="relative z-10 overflow-hidden bg-transparent pb-12 pt-[120px] dark:bg-gray-dark md:pb-16 md:pt-[150px] xl:pb-20 xl:pt-[180px] 2xl:pb-24 2xl:pt-[200px]"
      >
        {/* Hero background image - light mode only (white florals on black) */}
        <div
          className="absolute inset-0 z-[-2] bg-cover bg-center bg-no-repeat dark:opacity-0 dark:pointer-events-none"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
          aria-hidden
        />
        {/* Hero background image - dark mode only (light purple florals on black) */}
        <div
          className="absolute inset-0 z-[-2] bg-cover bg-center bg-no-repeat opacity-0 pointer-events-none dark:opacity-100 dark:pointer-events-auto"
          style={{ backgroundImage: "url('/here-bg-1.png')" }}
          aria-hidden
        />
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4">
              <div className="mx-auto max-w-[900px] text-center">
                <span className="mb-6 inline-block rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                  {t.hero.badge}
                </span>
                <h1 className="mb-6 text-4xl font-bold leading-tight text-black dark:text-white sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight">
                  {t.hero.title}
                </h1>
                <p className="mb-10 text-lg leading-relaxed text-body-color dark:text-body-color-dark sm:text-xl md:text-xl">
                  {t.hero.subtitle}
                </p>
                <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/products"
                    className="rounded-lg bg-primary px-8 py-4 text-base font-semibold text-white shadow-sm transition duration-300 ease-in-out hover:bg-primary-600 hover:shadow-md"
                  >
                    {t.hero.cta1}
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-block rounded-lg border-2 border-secondary-500 px-8 py-4 text-base font-semibold text-secondary-600 transition duration-300 ease-in-out hover:bg-secondary-500 hover:text-white dark:border-secondary-400 dark:text-secondary-400 dark:hover:bg-secondary-500"
                  >
                    {t.hero.cta2}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary sm:text-3xl">
                      {t.hero.stats.years.split(' ')[0]}
                    </div>
                    <div className="text-sm text-body-color dark:text-body-color-dark">
                      {t.hero.stats.years.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary sm:text-3xl">
                      {t.hero.stats.countries.split(' ')[0]}
                    </div>
                    <div className="text-sm text-body-color dark:text-body-color-dark">
                      {t.hero.stats.countries.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary sm:text-3xl">
                      {t.hero.stats.days.split(' ')[0]}
                    </div>
                    <div className="text-sm text-body-color dark:text-body-color-dark">
                      {t.hero.stats.days.split(' ').slice(1).join(' ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative SVG - Top Right */}
        <div className="absolute right-0 top-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="450"
            height="556"
            viewBox="0 0 450 556"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="277"
              cy="63"
              r="225"
              fill="url(#paint0_linear_hero)"
            />
            <circle
              cx="17.9997"
              cy="182"
              r="18"
              fill="url(#paint1_radial_hero)"
            />
            <circle
              cx="76.9997"
              cy="288"
              r="34"
              fill="url(#paint2_radial_hero)"
            />
            <circle
              cx="325.486"
              cy="302.87"
              r="180"
              transform="rotate(-37.6852 325.486 302.87)"
              fill="url(#paint3_linear_hero)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_hero"
                x1="-54.5003"
                y1="-178"
                x2="222"
                y2="288"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(170, 65%, 42%)" />
                <stop offset="1" stopColor="hsl(170, 65%, 42%)" stopOpacity="0" />
              </linearGradient>
              <radialGradient
                id="paint1_radial_hero"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(17.9997 182) rotate(90) scale(18)"
              >
                <stop offset="0.145833" stopColor="hsl(300, 45%, 38%)" stopOpacity="0" />
                <stop offset="1" stopColor="hsl(300, 45%, 38%)" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient
                id="paint2_radial_hero"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(76.9997 288) rotate(90) scale(34)"
              >
                <stop offset="0.145833" stopColor="hsl(170, 65%, 42%)" stopOpacity="0" />
                <stop offset="1" stopColor="hsl(170, 65%, 42%)" stopOpacity="0.08" />
              </radialGradient>
              <linearGradient
                id="paint3_linear_hero"
                x1="226.775"
                y1="-66.1548"
                x2="292.157"
                y2="351.421"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(300, 45%, 38%)" />
                <stop offset="1" stopColor="hsl(300, 45%, 38%)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {/* Decorative SVG - Bottom Left */}
        <div className="absolute bottom-0 left-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="364"
            height="201"
            viewBox="0 0 364 201"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24"
              stroke="url(#paint0_linear_hero_bottom)"
            />
            <path
              d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24"
              stroke="url(#paint1_linear_hero_bottom)"
            />
            <circle cx="220" cy="63" r="43" fill="url(#paint5_radial_hero_bottom)" />
            <defs>
              <linearGradient
                id="paint0_linear_hero_bottom"
                x1="184.389"
                y1="69.2405"
                x2="184.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(170, 65%, 42%)" stopOpacity="0" />
                <stop offset="1" stopColor="hsl(170, 65%, 42%)" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_hero_bottom"
                x1="156.389"
                y1="69.2405"
                x2="156.389"
                y2="212.24"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="hsl(300, 45%, 38%)" stopOpacity="0" />
                <stop offset="1" stopColor="hsl(300, 45%, 38%)" />
              </linearGradient>
              <radialGradient
                id="paint5_radial_hero_bottom"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(220 63) rotate(90) scale(43)"
              >
                <stop offset="0.145833" stopColor="white" stopOpacity="0" />
                <stop offset="1" stopColor="white" stopOpacity="0.08" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </section>
    </>
  );
};

export default Hero;
