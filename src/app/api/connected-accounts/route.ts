import { NextRequest, NextResponse } from "next/server";
import { OAuthManager } from "@/lib/auth/oauth-manager";
import { DbService } from "@/lib/supabase/db-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as "google" | "linkedin" | null;

    if (provider) {
      const status = await OAuthManager.getProviderStatus(provider);
      return NextResponse.json({ success: true, status });
    }

    const accounts = await OAuthManager.getConnectedAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, customScopes } = body;

    if (!provider || (provider !== "google" && provider !== "linkedin")) {
      return NextResponse.json({ success: false, error: "Invalid provider specified." }, { status: 400 });
    }

    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const isLocalhost = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";

    const origin = isLocalhost
      ? request.nextUrl.origin
      : forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : request.nextUrl.origin;

    const authUrl = OAuthManager.getAuthUrl(provider, origin, customScopes);
    return NextResponse.json({ success: true, authUrl });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as "google" | "linkedin";

    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider required." }, { status: 400 });
    }

    const success = await OAuthManager.disconnectProvider(provider);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
