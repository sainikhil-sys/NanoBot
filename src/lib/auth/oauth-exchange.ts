/**
 * Real OAuth authorization-code exchange for Google and LinkedIn. Exchanges the
 * code for tokens server-side and fetches the real account identity. Requires the
 * provider client id AND secret to be configured — otherwise it throws, so no
 * fake "connected" state is ever created.
 */

export interface ExchangedTokens {
  accessToken: string;
  refreshToken?: string;
  expiresInSec?: number;
  email?: string;
  accountId?: string;
  grantedScopes?: string[];
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<ExchangedTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth is not fully configured (need GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).");
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const t = await res.json();
  let email: string | undefined;
  let accountId: string | undefined;
  try {
    const ui = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    if (ui.ok) {
      const info = await ui.json();
      email = info.email;
      accountId = info.sub;
    }
  } catch {
    /* identity fetch best-effort */
  }
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresInSec: t.expires_in,
    grantedScopes: typeof t.scope === "string" ? t.scope.split(" ") : undefined,
    email,
    accountId,
  };
}

export async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<ExchangedTokens> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth is not fully configured (need LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET).");
  }
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error(`LinkedIn token exchange failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const t = await res.json();
  let email: string | undefined;
  let accountId: string | undefined;
  try {
    const ui = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    if (ui.ok) {
      const info = await ui.json();
      email = info.email;
      accountId = info.sub;
    }
  } catch {
    /* identity fetch best-effort */
  }
  return { accessToken: t.access_token, refreshToken: t.refresh_token, expiresInSec: t.expires_in, email, accountId };
}
