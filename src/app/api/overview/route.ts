import { NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const metrics = await DbService.getAiUsageMetrics();
    const recentTasks = await DbService.listTasks();
    const bots = await DbService.listBots();

    return NextResponse.json({
      metrics,
      recentTasks: recentTasks.slice(0, 5),
      bots,
    });
  } catch (error) {
    console.error("GET /api/overview error:", error);
    return NextResponse.json({ error: "Failed to fetch overview metrics" }, { status: 500 });
  }
}
