import { NextResponse } from "next/server";
import { createSSRSassClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/client-portal";

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

    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(new URL("/auth/clientes/login", request.url));
  }
}
