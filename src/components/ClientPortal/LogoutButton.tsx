"use client";

import { createSPASassClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const handleLogout = async () => {
    const client = createSPASassClient();
    await client.logout();
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-body-color shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-strokedark dark:bg-dark dark:text-body-color-dark dark:hover:border-red-400/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign out
    </button>
  );
}
