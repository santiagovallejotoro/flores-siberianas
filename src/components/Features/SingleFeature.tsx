import { Feature } from "@/types/feature";

const SingleFeature = ({ feature }: { feature: Feature }) => {
  const { icon, title, paragraph } = feature;
  return (
    <div className="group rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-white/10 dark:bg-white/5 dark:hover:shadow-primary-900/10">
      <div className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-all duration-300 group-hover:scale-110 group-hover:text-secondary-600 dark:bg-primary-500/15 dark:text-primary-300 dark:group-hover:bg-primary-500/25 dark:group-hover:text-secondary-400">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-black dark:text-white sm:text-2xl lg:text-xl xl:text-2xl">
        {title}
      </h3>
      <p className="text-base font-medium leading-relaxed text-body-color dark:text-body-color-dark">
        {paragraph}
      </p>
    </div>
  );
};

export default SingleFeature;
