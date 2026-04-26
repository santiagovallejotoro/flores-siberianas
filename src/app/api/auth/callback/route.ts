import { NextResponse } from "next/server";
import { createSSRSassClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/clientes/login", request.url));
  }

  try {
    const supabase = await createSSRSassClient();
    await supabase.exchangeCodeForSession(code);

    const {
      data: { user },
      error,
    } = await supabase.getSupabaseClient().auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL("/auth/clientes/login", request.url));
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
