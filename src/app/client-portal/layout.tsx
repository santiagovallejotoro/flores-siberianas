import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal | Flores Siberianas",
  description: "Sign in to the Flores Siberianas client portal to manage your orders and account.",
};

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
