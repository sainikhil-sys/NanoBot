import { PersonalTask, PersonalTaskPriority, PersonalTaskStatus } from "@/types/database.types";
import { DbService } from "@/lib/supabase/db-service";

export interface ExtractedTask {
  title: string;
  description?: string;
  dueDate?: string;
  priority: PersonalTaskPriority;
  category: string;
}

export class TasksService {
  /**
   * Lists personal tasks with filtering by status and priority.
   */
  static async listTasks(userId?: string): Promise<PersonalTask[]> {
    return DbService.listPersonalTasks(userId);
  }

  /**
   * Creates a new personal task.
   */
  static async createTask(params: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: PersonalTaskPriority;
    category?: string;
    sourceType?: "manual" | "email" | "chat" | "calendar" | "workflow";
    sourceId?: string;
    userId?: string;
  }): Promise<PersonalTask> {
    const task = await DbService.createPersonalTask({
      user_id: params.userId || "usr-prod-001",
      title: params.title,
      description: params.description || null,
      due_date: params.dueDate || null,
      priority: params.priority || "medium",
      status: "pending",
      category: params.category || "General",
      source_type: params.sourceType || "manual",
      source_id: params.sourceId || null,
      metadata: {},
    });

    await DbService.createAuditLog({
      user_id: params.userId || "usr-prod-001",
      action: "create_task",
      tool: "tasks.create",
      target: params.title,
      permission_level: "PREPARE",
      approval_status: "auto",
      result_status: "success",
      metadata: { taskId: task.id, title: task.title, priority: task.priority },
    });

    return task;
  }

  /**
   * Updates task status, due date, or priority.
   */
  static async updateTask(id: string, updates: Partial<PersonalTask>): Promise<PersonalTask | null> {
    return DbService.updatePersonalTask(id, updates);
  }

  /**
   * Toggles task completion status.
   */
  static async toggleComplete(id: string): Promise<PersonalTask | null> {
    const tasks = await DbService.listPersonalTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    const newStatus: PersonalTaskStatus = task.status === "completed" ? "pending" : "completed";
    return DbService.updatePersonalTask(id, { status: newStatus });
  }

  /**
   * Deletes a task.
   */
  static async deleteTask(id: string): Promise<boolean> {
    return DbService.deletePersonalTask(id);
  }

  /**
   * Intelligently parses and extracts tasks from emails, text, or natural language prompts.
   */
  static extractTasksFromText(text: string): ExtractedTask[] {
    const lower = text.toLowerCase();
    const tasks: ExtractedTask[] = [];

    // Parse specific action items or bullets
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 5);

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (
        lowerLine.startsWith("todo:") ||
        lowerLine.startsWith("- [ ]") ||
        lowerLine.includes("please send") ||
        lowerLine.includes("follow up") ||
        lowerLine.includes("need to") ||
        lowerLine.includes("action:") ||
        lowerLine.includes("remind me to") ||
        lowerLine.includes("schedule") ||
        lowerLine.includes("deploy")
      ) {
        let cleanTitle = line
          .replace(/^[-*•]\s*/, "")
          .replace(/^todo:\s*/i, "")
          .replace(/^action:\s*/i, "")
          .replace(/^remind me to\s*/i, "")
          .trim();

        // Capitalize first letter
        cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

        let priority: PersonalTaskPriority = "medium";
        if (lowerLine.includes("urgent") || lowerLine.includes("asap") || lowerLine.includes("critical")) {
          priority = "urgent";
        } else if (lowerLine.includes("important") || lowerLine.includes("priority") || lowerLine.includes("deadline")) {
          priority = "high";
        }

        let dueDate: string | undefined = undefined;
        const now = new Date();
        if (lowerLine.includes("tomorrow")) {
          const d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          dueDate = d.toISOString();
        } else if (lowerLine.includes("friday")) {
          const d = new Date(now);
          const day = d.getDay();
          const diff = (5 - day + 7) % 7 || 7;
          d.setDate(d.getDate() + diff);
          dueDate = d.toISOString();
        }

        tasks.push({
          title: cleanTitle,
          priority,
          dueDate,
          category: lowerLine.includes("email") ? "Email Follow-up" : "Personal",
        });
      }
    }

    // If no specific lines matched but the whole text was a reminder prompt
    if (tasks.length === 0 && (lower.includes("remind me") || lower.includes("follow up") || lower.includes("task"))) {
      let title = text.replace(/^remind me to\s*/i, "").replace(/^create a task to\s*/i, "").trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);

      let priority: PersonalTaskPriority = "medium";
      if (lower.includes("urgent") || lower.includes("asap")) priority = "urgent";
      if (lower.includes("investor") || lower.includes("client")) priority = "high";

      let dueDate: string | undefined = undefined;
      const now = new Date();
      if (lower.includes("friday")) {
        const d = new Date(now);
        const day = d.getDay();
        const diff = (5 - day + 7) % 7 || 7;
        d.setDate(d.getDate() + diff);
        dueDate = d.toISOString();
      }

      tasks.push({
        title,
        priority,
        dueDate,
        category: "Personal",
      });
    }

    return tasks;
  }
}
