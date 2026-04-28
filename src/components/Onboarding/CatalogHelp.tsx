interface CatalogHelpProps {
  why: string;
  example?: string;
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 transition-transform duration-200 group-open:rotate-90"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function CatalogHelp({ why, example }: CatalogHelpProps) {
  return (
    <details className="group mb-6 rounded-xl border border-stroke bg-white open:border-primary/40 dark:border-strokedark dark:bg-dark dark:open:border-primary/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-200 [&::-webkit-details-marker]:hidden">
        <ChevronIcon />
        ¿Por qué necesito esto?
      </summary>
      <div className="border-t border-stroke px-4 py-4 dark:border-strokedark">
        <p className="text-sm leading-relaxed text-body-color dark:text-body-color-dark">
          {why}
        </p>
        {example && (
          <p className="mt-3 rounded-lg border border-stroke bg-gray-50 px-3 py-2 text-xs leading-relaxed text-body-color dark:border-strokedark dark:bg-white/5 dark:text-body-color-dark">
            <span className="font-semibold text-black dark:text-white">
              Ejemplo:
            </span>{" "}
            {example}
          </p>
        )}
      </div>
    </details>
  );
}
