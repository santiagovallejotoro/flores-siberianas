import { Metadata } from "next";
import { createSSRSassClient } from "@/lib/supabase/server";
import { getOnboardingStatus } from "@/lib/farm/onboarding";
import WizardProgress from "@/components/Onboarding/WizardProgress";

export const metadata: Metadata = {
  title: "Primeros pasos | Portal Proveedor",
  robots: { index: false, follow: false },
};

export default async function PrimerosPasosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSSRSassClient();
  const status = await getOnboardingStatus(supabase.getSupabaseClient());

  return (
    <div className="space-y-6">
      <WizardProgress status={status} />
      <div>{children}</div>
    </div>
  );
}
