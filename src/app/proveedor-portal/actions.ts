"use server";

import { buildDashboardPayload } from "@/lib/farm/dashboard";
import { createSSRSassClient } from "@/lib/supabase/server";

export async function reloadProveedorDashboard(input: {
  from: string;
  to: string;
  financialYear: number;
}) {
  const sass = await createSSRSassClient();
  const client = sass.getSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return buildDashboardPayload(client, input);
}
