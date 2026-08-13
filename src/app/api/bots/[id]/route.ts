import { NextRequest, NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const bot = await DbService.getBot(id);

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const allTasks = await DbService.listTasks();
    const botTasks = allTasks.filter((t) => t.bot_id === bot.id || t.bot?.slug === bot.slug);
    const completedCount = botTasks.filter((t) => t.status === "completed").length;
    const successRate = botTasks.length > 0 ? Math.round((completedCount / botTasks.length) * 100) : null;

    return NextResponse.json({
      bot,
      stats: {
        totalTasks: botTasks.length,
        completedTasks: completedCount,
        successRate,
      },
      recentTasks: botTasks.slice(0, 10),
    });
  } catch (error) {
    console.error("GET /api/bots/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch bot details" }, { status: 500 });
  }
}
