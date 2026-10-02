/**
 * Automation engine: binds a trigger to a workflow and records real executions.
 *
 * Running an automation executes the latest published version of its workflow
 * through {@link WorkflowEngine}, then updates the automation's real run metadata
 * (last run, status, next run, execution count). No metric is ever fabricated —
 * `executionCount` only increments when a run actually happens.
 */

import {
  Automation,
  AutomationTriggerType,
  WorkflowExecutionRecord,
  RetryPolicy,
} from "@/lib/workflows/types";
import { WorkflowEngine } from "@/lib/workflows/workflow-engine";
import { WorkflowStore } from "@/lib/workflows/store";
import { computeNextRun } from "./cron";

export interface RunAutomationResult {
  run?: WorkflowExecutionRecord;
  error?: string;
}

export class AutomationEngine {
  /** Execute an automation now against the latest version of its workflow. */
  static async run(
    automation: Automation,
    opts: { payload?: Record<string, unknown>; trigger?: AutomationTriggerType; idempotencyKey?: string; sleep?: (ms: number) => Promise<void> } = {}
  ): Promise<RunAutomationResult> {
    const workflow = WorkflowStore.getWorkflow(automation.workflowId);
    if (!workflow) {
      const error = `Workflow "${automation.workflowId}" referenced by automation no longer exists.`;
      this.recordOutcome(automation, "failed");
      return { error };
    }

    const version = WorkflowStore.latestVersionNumber(automation.workflowId) || undefined;
    const run = await WorkflowEngine.executeWorkflow(workflow, {
      payload: { ...(opts.payload ?? {}), __automationId: automation.id },
      userId: automation.userId,
      trigger: opts.trigger ?? automation.triggerType,
      idempotencyKey: opts.idempotencyKey,
      version,
      retryPolicy: automation.retryPolicy as RetryPolicy | undefined,
      sleep: opts.sleep,
    });

    this.recordOutcome(automation, run.status);
    return { run };
  }

  private static recordOutcome(automation: Automation, status: WorkflowExecutionRecord["status"]): void {
    const now = new Date();
    automation.lastRunAt = now.toISOString();
    automation.lastRunStatus = status;
    automation.executionCount += 1;
    automation.updatedAt = now.toISOString();
    if (automation.triggerType === "schedule" && automation.schedule && automation.status === "active") {
      automation.nextRunAt = computeNextRun(automation.schedule, now) ?? undefined;
    }
    WorkflowStore.saveAutomation(automation);
  }

  /**
   * Process all due scheduled automations. Intended to be called by an external
   * scheduler (cron, Vercel Cron, Supabase pg_cron) hitting /api/automations/tick.
   */
  static async tick(now: Date = new Date()): Promise<{ processed: string[]; results: Record<string, string> }> {
    const due = WorkflowStore.listAutomations().filter(
      (a) =>
        a.status === "active" &&
        a.triggerType === "schedule" &&
        a.nextRunAt != null &&
        new Date(a.nextRunAt).getTime() <= now.getTime()
    );

    const processed: string[] = [];
    const results: Record<string, string> = {};
    for (const automation of due) {
      processed.push(automation.id);
      const { run, error } = await this.run(automation, { trigger: "schedule" });
      results[automation.id] = error ? `error: ${error}` : (run?.status ?? "unknown");
    }
    return { processed, results };
  }
}
