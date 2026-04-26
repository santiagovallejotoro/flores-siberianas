"use client";

import { useTheme } from "next-themes";

interface TopbarProps {
  displayName: string;
  memberDays: number;
  onMenuToggle: () => void;
}

export default function Topbar({ displayName, memberDays, onMenuToggle }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  const greeting =
    new Date().getHours() < 12
      ? "Buenos días"
      : new Date().getHours() < 18
        ? "Buenas tardes"
        : "Buenas noches";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-stroke bg-white px-4 dark:border-strokedark dark:bg-dark md:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-body-color transition-colors hover:bg-gray-100 dark:text-body-color-dark dark:hover:bg-white/5 lg:hidden"
        aria-label="Abrir menú"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Greeting */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-black dark:text-white">
          {greeting}, {displayName.split(" ")[0]}
        </p>
        <p className="hidden text-xs text-body-color dark:text-body-color-dark sm:block">
          Miembro desde hace {memberDays} {memberDays === 1 ? "día" : "días"}
        </p>
      </div>

      {/* Right-side controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          aria-label="Cambiar tema"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-black transition-colors hover:bg-gray-200 dark:bg-dark-bg dark:text-white dark:hover:bg-white/10"
        >
          {/* Moon — show in light mode */}
          <svg
            viewBox="0 0 23 23"
            className="h-5 w-5 stroke-current dark:hidden"
            fill="none"
          >
            <path
              d="M9.55078 1.5C5.80078 1.5 1.30078 5.25 1.30078 11.25C1.30078 17.25 5.80078 21.75 11.8008 21.75C17.8008 21.75 21.5508 17.25 21.5508 13.5C13.3008 18.75 4.30078 9.75 9.55078 1.5Z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Sun — show in dark mode */}
          <svg
            viewBox="0 0 24 24"
            className="hidden h-5 w-5 dark:block"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </button>
      </div>
    </header>
  );
}
