import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");
  const rawNext = requestUrl.searchParams.get("next") || "/app/overview";

  // Prevent open redirect attacks: ensure next is a relative path within our app
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app/overview";

  if (error) {
    console.error("OAuth provider error:", error, error_description);
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || "Authentication failed")}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    console.error("OAuth code exchange error:", exchangeError.message);
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=OAuthFailed&error_description=${encodeURIComponent(exchangeError.message)}`,
        requestUrl.origin
      )
    );
  }

  // Return user to sign-in page if no code or error
  return NextResponse.redirect(
    new URL(
      "/auth/sign-in?error=OAuthFailed&error_description=No+authorization+code+received",
      requestUrl.origin
    )
  );
}

