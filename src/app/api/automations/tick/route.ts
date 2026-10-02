import { NextRequest, NextResponse } from "next/server";
import { AutomationEngine } from "@/lib/automations/engine";

/**
 * Scheduler tick. Serverless deployments have no always-on worker, so an external
 * scheduler (Vercel Cron, Supabase pg_cron, GitHub Actions, …) should POST here on
 * a fixed cadence to execute any automations whose next run is due.
 *
 * Protect with a shared secret: set CRON_SECRET and send it as a Bearer token.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await AutomationEngine.tick();
  return NextResponse.json({
    ok: true,
    processed: result.processed.length,
    results: result.results,
  });
}
