import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ClientType, SassClient } from "@/lib/supabase/unified";

export async function createSSRClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // In some Next.js server contexts cookies cannot be set — safe to ignore
          }
        },
      },
    },
  );
}

export async function createSSRSassClient() {
  const client = await createSSRClient();
  return new SassClient(client, ClientType.SERVER);
}

/** Returns the authenticated user for the current request.
 *  Deduplicated via React cache — the network call fires only once
 *  per request, even if called from multiple server components. */
export const getAuthUser = cache(async () => {
  const client = await createSSRClient();
  return client.auth.getUser();
});
