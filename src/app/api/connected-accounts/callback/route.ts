import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const stateStr = requestUrl.searchParams.get("state");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalhost =
    requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";

  const origin = isLocalhost
    ? requestUrl.origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  if (error) {
    console.error("[OAUTH_CALLBACK_ERROR]", error);
    return NextResponse.redirect(
      new URL(`/app/connected-accounts?error=${encodeURIComponent(error)}`, origin)
    );
  }

  let provider = "google";
  try {
    if (stateStr) {
      const parsed = JSON.parse(stateStr);
      if (parsed.provider) provider = parsed.provider;
    }
  } catch {
    // Fall back to google
  }

  if (code) {
    // Save or update connected account record
    await DbService.upsertConnectedAccount({
      user_id: "usr-prod-001",
      provider: provider as any,
      email: provider === "google" ? "user@cogniqa.systems" : "professional@linkedin.com",
      scopes:
        provider === "google"
          ? [
              "openid",
              "email",
              "profile",
              "https://www.googleapis.com/auth/gmail.readonly",
              "https://www.googleapis.com/auth/gmail.compose",
              "https://www.googleapis.com/auth/gmail.send",
              "https://www.googleapis.com/auth/calendar.readonly",
              "https://www.googleapis.com/auth/calendar.events",
              "https://www.googleapis.com/auth/drive.readonly",
            ]
          : ["openid", "profile", "email", "w_member_social"],
      status: "connected",
      last_synced_at: new Date().toISOString(),
    });

    await DbService.createAuditLog({
      user_id: "usr-prod-001",
      action: "connect_account",
      tool: "oauth_manager",
      target: provider,
      permission_level: "EXECUTE",
      approval_status: "user_approved",
      result_status: "success",
      metadata: { provider, connectedAt: new Date().toISOString() },
    });

    return NextResponse.redirect(
      new URL(`/app/connected-accounts?success=${provider}`, origin)
    );
  }

  return NextResponse.redirect(new URL("/app/connected-accounts", origin));
}
