import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";
import { exchangeGoogleCode, exchangeLinkedInCode } from "@/lib/auth/oauth-exchange";
import { encryptSecret } from "@/lib/auth/credentials";

/**
 * OAuth callback: performs a REAL authorization-code exchange, stores encrypted
 * tokens and the real account identity, and only then marks the account connected.
 * Any failure redirects back with an error — it never fabricates a connection.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");
  const stateStr = requestUrl.searchParams.get("state");

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalhost = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";
  const origin = isLocalhost
    ? requestUrl.origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : requestUrl.origin;

  const fail = (message: string) =>
    NextResponse.redirect(new URL(`/app/connected-accounts?error=${encodeURIComponent(message)}`, origin));

  if (oauthError) {
    console.error("[OAUTH_CALLBACK_ERROR]", oauthError);
    return fail(oauthError);
  }
  if (!code) return NextResponse.redirect(new URL("/app/connected-accounts", origin));

  let provider: "google" | "linkedin" = "google";
  try {
    if (stateStr) {
      const parsed = JSON.parse(stateStr);
      if (parsed.provider === "linkedin" || parsed.provider === "google") provider = parsed.provider;
    }
  } catch {
    /* default google */
  }

  const redirectUri = `${origin}/api/connected-accounts/callback`;

  try {
    const tokens =
      provider === "google"
        ? await exchangeGoogleCode(code, redirectUri)
        : await exchangeLinkedInCode(code, redirectUri);

    const expiresAt = tokens.expiresInSec
      ? new Date(Date.now() + tokens.expiresInSec * 1000).toISOString()
      : null;

    await DbService.upsertConnectedAccount({
      user_id: "usr-prod-001",
      provider,
      provider_account_id: tokens.accountId ?? null,
      email: tokens.email ?? null,
      scopes:
        tokens.grantedScopes ??
        (provider === "google"
          ? ["openid", "email", "profile"]
          : ["openid", "profile", "email"]),
      access_token_encrypted: encryptSecret(tokens.accessToken),
      refresh_token_encrypted: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
      token_expires_at: expiresAt,
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
      metadata: { provider, connectedAt: new Date().toISOString(), account: tokens.email ?? tokens.accountId ?? "unknown" },
    });

    return NextResponse.redirect(new URL(`/app/connected-accounts?success=${provider}`, origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    console.error("[OAUTH_EXCHANGE_ERROR]", message);
    return fail(message);
  }
}
