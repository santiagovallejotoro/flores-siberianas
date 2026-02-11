"use client";
import { useLanguage } from "@/contexts/LanguageContext";

const OurTeam = () => {
  const { t } = useLanguage();

  const TeamCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
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
        <div className="border-b border-body-color/[.15] pb-10 dark:border-white/[.15] md:pb-12 lg:pb-16">
          <div className="mb-10 text-center">
            <span className="mb-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
              {t.about.team.eyebrow}
            </span>
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl md:text-[40px]">
              {t.about.team.eyebrow}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-body-color dark:text-body-color-dark">
              {t.about.team.title}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <TeamCard
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M12 9v13M8 22h8" />
                </svg>
              }
              title={t.about.team.roles.agronomic.title}
              description={t.about.team.roles.agronomic.description}
            />
            <TeamCard
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
              title={t.about.team.roles.quality.title}
              description={t.about.team.roles.quality.description}
            />
            <TeamCard
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              }
              title={t.about.team.roles.logistics.title}
              description={t.about.team.roles.logistics.description}
            />
            <TeamCard
              icon={
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              }
              title={t.about.team.roles.data.title}
              description={t.about.team.roles.data.description}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurTeam;
