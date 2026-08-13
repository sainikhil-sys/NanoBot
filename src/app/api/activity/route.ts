import { NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";

export async function GET() {
  try {
    const tasks = await DbService.listTasks();
    const notifications = await DbService.listNotifications();

    // Map tasks to activity items
    const activities = tasks.map((t) => ({
      id: `act-${t.id}`,
      type: t.status === "completed" ? "task_completed" : t.status === "failed" ? "task_failed" : "task_started",
      title: t.status === "completed" ? "Task Execution Complete" : t.status === "failed" ? "Task Failed" : "Task Running",
      description: t.title,
      botName: t.bot?.name || "NanoBot Orchestrator",
      timestamp: t.completed_at || t.started_at || t.created_at,
      taskId: t.id,
      status: t.status,
    }));

    return NextResponse.json({ activities, notifications });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}
