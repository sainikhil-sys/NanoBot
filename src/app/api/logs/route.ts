import { NextResponse } from "next/server";
import { DbService } from "@/lib/supabase/db-service";
import { WorkflowEngine } from "@/lib/workflows/workflow-engine";

export async function GET() {
  try {
    const tasks = await DbService.listTasks();
    const executions = WorkflowEngine.getAllExecutions();
    const notifications = await DbService.listNotifications();

    const logs: Array<{
      id: string;
      timestamp: string;
      severity: "info" | "warn" | "error" | "success";
      component: string;
      executionId?: string;
      message: string;
    }> = [];

    // Map workflow executions to log entries
    for (const exec of executions) {
      logs.push({
        id: `log-wf-${exec.id}`,
        timestamp: new Date(exec.startedAt).toLocaleTimeString(),
        severity: exec.status === "completed" ? "success" : exec.status === "failed" ? "error" : "info",
        component: "WorkflowEngine",
        executionId: exec.id,
        message: `Workflow '${exec.workflowName}' executed ${exec.nodeExecutions.length} nodes in ${exec.durationMs}ms with status: ${exec.status}.`,
      });

      for (const node of exec.nodeExecutions) {
        logs.push({
          id: `log-node-${node.nodeId}-${exec.id}`,
          timestamp: new Date(node.completedAt || exec.startedAt).toLocaleTimeString(),
          severity: node.status === "success" ? "success" : node.status === "failed" ? "error" : "info",
          component: node.nodeType,
          executionId: exec.id,
          message: `Step '${node.nodeTitle}' (${node.nodeType}) finished in ${node.durationMs}ms: ${node.error || (node.output ? "Payload generated successfully" : "Executed")}`,
        });
      }
    }

    // Map tasks to log entries
    for (const task of tasks) {
      logs.push({
        id: `log-task-${task.id}`,
        timestamp: new Date(task.created_at).toLocaleTimeString(),
        severity: task.status === "completed" ? "success" : task.status === "failed" ? "error" : "info",
        component: "TaskExecutor",
        message: `Task '${task.title}' [${task.task_type}] status: ${task.status}. Handled by ${task.bot?.name || "NanoBot Core"}.`,
      });
    }

    // Map notifications
    for (const notif of notifications) {
      logs.push({
        id: `log-notif-${notif.id}`,
        timestamp: new Date(notif.created_at).toLocaleTimeString(),
        severity: notif.type === "task_failed" ? "error" : notif.type === "task_completed" ? "success" : "info",
        component: "NotificationService",
        message: `${notif.title}: ${notif.message}`,
      });
    }

    // Sort by timestamp descending
    logs.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
