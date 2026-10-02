import { DbService } from "@/lib/supabase/db-service";
import { ConnectedAccount } from "@/types/database.types";

export interface ProviderScopeInfo {
  provider: "google" | "linkedin";
  name: string;
  description: string;
  requiredScopes: string[];
  recommendedScopes: string[];
  docUrl: string;
}

export const OAUTH_PROVIDERS: Record<string, ProviderScopeInfo> = {
  google: {
    provider: "google",
    name: "Google Workspace (Gmail, Calendar, Drive)",
    description: "Connect your Google account for email classification, smart calendar scheduling, and Drive context search.",
    requiredScopes: [
      "openid",
      "email",
      "profile",
    ],
    recommendedScopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    docUrl: "https://developers.google.com/identity/protocols/oauth2/scopes",
  },
  linkedin: {
    provider: "linkedin",
    name: "LinkedIn",
    description: "Connect LinkedIn to draft thought leadership posts, optimize hashtags, and publish updates with your approval.",
    requiredScopes: [
      "openid",
      "profile",
      "email",
    ],
    recommendedScopes: [
      "w_member_social",
    ],
    docUrl: "https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin",
  },
};

export class OAuthManager {
  /**
   * Retrieves active connected accounts for a given user.
   */
  static async getConnectedAccounts(userId?: string): Promise<ConnectedAccount[]> {
    return DbService.listConnectedAccounts(userId);
  }

  /**
   * Check connection status for a specific provider.
   */
  static async getProviderStatus(provider: "google" | "linkedin", userId?: string): Promise<{
    connected: boolean;
    account?: ConnectedAccount;
    missingScopes: string[];
  }> {
    const accounts = await DbService.listConnectedAccounts(userId);
    const account = accounts.find((a) => a.provider === provider && a.status === "connected");

    if (!account) {
      return { connected: false, missingScopes: OAUTH_PROVIDERS[provider]?.recommendedScopes || [] };
    }

    const providerInfo = OAUTH_PROVIDERS[provider];
    const userScopes = new Set(account.scopes || []);
    const missingScopes = (providerInfo?.recommendedScopes || []).filter((s) => !userScopes.has(s));

    return {
      connected: true,
      account,
      missingScopes,
    };
  }

  /**
   * Generate OAuth Authorization URL for Google or LinkedIn.
   */
  static getAuthUrl(provider: "google" | "linkedin", origin: string, customScopes?: string[]): string {
    const redirectUri = `${origin}/api/connected-accounts/callback`;

    if (provider === "google") {
      // Credentials must come from the environment — never hard-coded (rule #11).
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error(
          `Google is not configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then register this exact redirect URI in your Google Cloud Console OAuth client: ${redirectUri}`
        );
      }

      const scopes = [
        ...OAUTH_PROVIDERS.google.requiredScopes,
        ...(customScopes || OAUTH_PROVIDERS.google.recommendedScopes),
      ].join(" ");

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes,
        access_type: "offline",
        prompt: "consent",
        state: JSON.stringify({ provider: "google" }),
      });

      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    if (provider === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      if (!clientId) {
        throw new Error(
          `LinkedIn is not configured yet. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET, then register this exact redirect URI in the LinkedIn Developer portal: ${redirectUri}`
        );
      }
      const scopes = [
        ...OAUTH_PROVIDERS.linkedin.requiredScopes,
        ...(customScopes || OAUTH_PROVIDERS.linkedin.recommendedScopes),
      ].join(" ");

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: redirectUri,
        state: JSON.stringify({ provider: "linkedin" }),
        scope: scopes,
      });

      return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  /**
   * Revoke & Disconnect a provider safely.
   */
  static async disconnectProvider(provider: "google" | "linkedin", userId?: string): Promise<boolean> {
    const result = await DbService.deleteConnectedAccount(provider, userId);
    await DbService.createAuditLog({
      user_id: userId || "usr-prod-001",
      action: "disconnect_account",
      tool: "oauth_manager",
      target: provider,
      permission_level: "EXECUTE",
      approval_status: "user_approved",
      result_status: result ? "success" : "failed",
      metadata: { provider, disconnectedAt: new Date().toISOString() },
    });
    return result;
  }
}

