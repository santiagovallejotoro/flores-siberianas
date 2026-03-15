import { Metadata } from "next";
import CreditApplicationForm from "@/components/CreditApplication/CreditApplicationForm";

export const metadata: Metadata = {
  title: "Credit Application | Flores Siberianas",
  description:
    "Apply for a commercial credit account with Flores Siberianas. Fast review, confidential processing.",
  robots: { index: false, follow: false },
};

export default function CreditApplicationPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark">
      {/* Spacer for absolute-positioned site Header */}
      <div className="pt-28 lg:pt-[140px]" />

      <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6">
        <CreditApplicationForm />
      </div>
    </main>
  );
}
