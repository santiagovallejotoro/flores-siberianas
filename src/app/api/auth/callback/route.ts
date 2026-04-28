import { NextResponse } from "next/server";
import { createSSRSassClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["cliente", "proveedor"] as const;
type Role = (typeof VALID_ROLES)[number];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const roleParam = requestUrl.searchParams.get("role") as Role | null;

  if (!code) {
    return NextResponse.redirect(new URL("/auth/clientes/login", request.url));
  }

  try {
    const supabase = await createSSRSassClient();
    const { data: { user }, error } = await supabase.exchangeCodeForSession(code);

    if (error || !user) {
      return NextResponse.redirect(new URL("/auth/clientes/login", request.url));
    }

    // When a role override is requested (e.g. from the proveedor Google register button),
    // upsert it on the profile so the DB trigger default is corrected.
    // The trigger only runs on INSERT into auth.users and reads the role from metadata
    // at that moment — for Google OAuth the metadata has no "role", so the trigger
    // defaults to "cliente" and never creates the role-specific profile row.
    // We therefore patch both tables here using the admin client (bypasses RLS which
    // would still see the old role within this same request).
    if (roleParam && VALID_ROLES.includes(roleParam)) {
      const admin = createAdminClient();

      await admin
        .from("profiles")
        .upsert({ id: user.id, role: roleParam }, { onConflict: "id" });

      if (roleParam === "proveedor") {
        // Ensure the proveedores row exists. Use ignoreDuplicates so we never
        // overwrite data a user may have already saved via the complete-profile page.
        await admin
          .from("proveedores")
          .upsert({ id: user.id, correo: user.email }, { onConflict: "id", ignoreDuplicates: true });

        // Remove the clientes row the trigger may have created by mistake.
        await admin.from("clientes").delete().eq("id", user.id);
      }

      if (roleParam === "cliente") {
        await admin
          .from("clientes")
          .upsert({ id: user.id, correo: user.email }, { onConflict: "id", ignoreDuplicates: true });
      }
    }

    // If an explicit destination was provided (e.g. from the Google button), honour it.
    if (next) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    // Otherwise look up the user's role to decide which portal to send them to.
    const { data: profile } = await supabase
      .getSupabaseClient()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const destination =
      profile?.role === "proveedor" ? "/proveedor-portal" : "/client-portal";

    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return NextResponse.redirect(new URL("/auth/clientes/login", request.url));
  }
}
