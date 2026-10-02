import { DailyBriefing } from "@/types/database.types";
import { DbService } from "@/lib/supabase/db-service";
import { GmailService } from "./gmail-service";
import { CalendarService } from "./calendar-service";
import { TasksService } from "./tasks-service";

export class BriefingService {
  /**
   * Generates or retrieves the Daily AI Briefing from live connected services.
   */
  static async generateDailyBriefing(userId?: string): Promise<DailyBriefing> {
    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch live data concurrently from services
    const [emailRes, calendarRes, tasks] = await Promise.all([
      GmailService.searchEmails({ maxResults: 5, unreadOnly: true }),
      CalendarService.listEvents({ maxResults: 5, userId }),
      TasksService.listTasks(userId),
    ]);

    const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
    const overdueTasks = pendingTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date()
    );

    // Email highlights
    const emailHighlights = emailRes.emails.map((e) => ({
      id: e.id,
      subject: e.subject,
      from: e.fromName || e.from,
      category: e.classification.category,
      urgency: (e.classification.urgencyScore > 75
        ? "high"
        : e.classification.urgencyScore > 40
        ? "medium"
        : "low") as "high" | "medium" | "low",
      summary: e.classification.summary,
      actionRequired: e.classification.detectedAction || undefined,
    }));

    // Calendar highlights
    const calendarHighlights = calendarRes.events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      startTime: ev.startTime,
      endTime: ev.endTime,
      attendees: ev.attendees.map((a) => a.name || a.email),
      prepNotes: ev.prepNotes,
    }));

    // Task highlights
    const taskHighlights = pendingTasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date || undefined,
      priority: t.priority,
      isOverdue: t.due_date ? new Date(t.due_date) < new Date() : false,
    }));

    // Dynamic AI Recommendations
    const recommendations: string[] = [];
    if (emailHighlights.some((e) => e.urgency === "high")) {
      recommendations.push("Review and respond to high-urgency emails in your inbox.");
    }
    if (calendarHighlights.length > 0) {
      const nextMeeting = calendarHighlights[0];
      const timeStr = new Date(nextMeeting.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      recommendations.push(`Prepare agenda and notes for upcoming meeting "${nextMeeting.title}" at ${timeStr}.`);
    }
    if (overdueTasks.length > 0) {
      recommendations.push(`Complete ${overdueTasks.length} overdue task(s) to maintain schedule velocity.`);
    }
    if (recommendations.length === 0) {
      recommendations.push("All critical inboxes and calendar items are clear. Focus on primary project milestones.");
    }

    const summary = `Daily Briefing for ${new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}: You have ${emailHighlights.length} active email items, ${calendarHighlights.length} scheduled meeting(s), and ${pendingTasks.length} pending task(s).`;

    const briefing: DailyBriefing = {
      id: `brf-${todayStr}`,
      user_id: userId || "usr-prod-001",
      date: todayStr,
      summary,
      email_highlights: emailHighlights,
      calendar_highlights: calendarHighlights,
      task_highlights: taskHighlights,
      recommendations,
      created_at: new Date().toISOString(),
    };

    await DbService.saveDailyBriefing(briefing);
    return briefing;
  }
}
