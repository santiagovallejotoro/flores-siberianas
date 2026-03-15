import { createSSRSassClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/ClientPortal/LogoutButton";
import ClientPortalDashboardCards from "@/components/ClientPortal/ClientPortalDashboardCards";

export default async function ClientPortalPage() {
  const supabase = await createSSRSassClient();
  const {
    data: { user },
  } = await supabase.getSupabaseClient().auth.getUser();

  if (!user) {
    redirect("/auth/clientes/login");
  }

  return (
    <section className="relative z-10 overflow-hidden pt-36 pb-16 md:pb-20 lg:pt-[180px] lg:pb-28">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-10 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
                Client Portal
              </h1>
              <p className="mt-2 text-body-color dark:text-body-color-dark">
                Welcome back,{" "}
                <span className="font-medium text-primary">
                  {user.email}
                </span>
              </p>
            </div>
            <LogoutButton />
          </div>

          {/* Portal content grid */}
          <ClientPortalDashboardCards />

          {/* Account info */}
          <div className="mt-10 rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-dark">
            <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
              Account
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-stroke pb-3 dark:border-strokedark">
                <span className="text-body-color dark:text-body-color-dark">Email</span>
                <span className="font-medium text-black dark:text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-color dark:text-body-color-dark">Member since</span>
                <span className="font-medium text-black dark:text-white">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
