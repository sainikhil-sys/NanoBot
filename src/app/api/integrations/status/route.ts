import { NextResponse } from "next/server";

/**
 * Reports which integrations are actually usable in this deployment, based on
 * real configuration. Returns booleans only — never secret values (rule #10).
 * A capability is "available" only when its execution path can actually run.
 */
function configured(name: string): boolean {
  const v = process.env[name];
  return !!v && !v.startsWith("your-") && !v.startsWith("dummy-");
}

export async function GET() {
  return NextResponse.json({
    capabilities: {
      http: true, // SSRF-guarded HTTP node — always available
      webhooks: true, // signed, idempotent webhook engine — always available
      webSearch: true, // DuckDuckGo-backed, no key required
      embeddings: true, // local deterministic embeddings
      llm: configured("GROQ_API_KEY") || configured("OPENROUTER_API_KEY"),
      email: configured("RESEND_API_KEY"),
      google: configured("GOOGLE_CLIENT_ID"),
      linkedin: configured("LINKEDIN_CLIENT_ID"),
    },
  });
}
