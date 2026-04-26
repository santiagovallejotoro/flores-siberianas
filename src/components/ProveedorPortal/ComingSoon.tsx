interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* Icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 text-primary ring-2 ring-primary-200/50 ring-offset-2 ring-offset-background dark:from-primary-500/20 dark:to-secondary-500/15 dark:text-primary-300 dark:ring-primary-500/30 dark:ring-offset-dark">
        {icon ?? (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )}
      </div>

      <h1 className="mb-2 text-2xl font-bold text-black dark:text-white">{title}</h1>

      {description && (
        <p className="mb-5 max-w-sm text-sm text-body-color dark:text-body-color-dark">
          {description}
        </p>
      )}

      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/50 bg-gradient-to-r from-primary-100 via-white to-secondary-100 px-3.5 py-1.5 text-xs font-semibold text-primary-700 shadow-sm dark:border-primary-500/25 dark:from-primary-500/12 dark:via-secondary-500/5 dark:to-secondary-500/15 dark:text-primary-200">
        <svg
          className="text-secondary-600 dark:text-secondary-400"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent dark:from-primary-300 dark:to-secondary-300">
          En construcción
        </span>
      </span>
    </div>
  );
}
