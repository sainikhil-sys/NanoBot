import { NextRequest, NextResponse } from "next/server";
import { Automation, AutomationTriggerType } from "@/lib/workflows/types";
import { WorkflowStore } from "@/lib/workflows/store";
import { DEFAULT_WORKFLOWS } from "@/lib/workflows/seed";
import { parseSchedule, computeNextRun } from "@/lib/automations/cron";
import { generateWebhookSecret } from "@/lib/workflows/webhooks";
import { DbService } from "@/lib/supabase/db-service";

function ensureWorkflowsSeeded() {
  if (WorkflowStore.listWorkflows().length === 0) {
    for (const def of DEFAULT_WORKFLOWS) WorkflowStore.publish(def);
  }
}

export async function GET() {
  // No fabricated automations — the list is empty until the user creates one.
  const automations = WorkflowStore.listAutomations();
  return NextResponse.json({ automations });
}

export async function POST(req: NextRequest) {
  try {
    ensureWorkflowsSeeded();
    const body = await req.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "An automation 'name' is required." }, { status: 400 });
    }
    const workflow = WorkflowStore.getWorkflow(body.workflowId);
    if (!workflow) {
      return NextResponse.json(
        { error: "A valid 'workflowId' is required to create an automation." },
        { status: 400 }
      );
    }

    const triggerType: AutomationTriggerType = body.triggerType || "manual";
    let schedule: string | undefined;
    let nextRunAt: string | undefined;

    if (triggerType === "schedule") {
      schedule = String(body.schedule || "");
      const parsed = parseSchedule(schedule);
      if (!parsed.valid) {
        return NextResponse.json(
          { error: `Invalid schedule "${schedule}". Use a cron expression or every:<n>m|h|d.` },
          { status: 400 }
        );
      }
      nextRunAt = computeNextRun(schedule) ?? undefined;
    }

    const userId = await DbService.getCurrentUserId().catch(() => undefined);
    const now = new Date().toISOString();
    const automation: Automation = {
      id: `auto-${Date.now()}`,
      userId,
      name: body.name,
      description: body.description || "",
      workflowId: workflow.id,
      workflowName: workflow.name,
      triggerType,
      schedule,
      // Webhook automations get a signing secret so inbound calls can be verified.
      webhookSecret: triggerType === "webhook" ? generateWebhookSecret() : undefined,
      timezone: body.timezone || "UTC",
      retryPolicy: body.retryPolicy,
      status: "active",
      createdAt: now,
      updatedAt: now,
      nextRunAt,
      executionCount: 0,
    };

    WorkflowStore.saveAutomation(automation);
    return NextResponse.json({ automation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid automation configuration" },
      { status: 400 }
    );
  }
}
