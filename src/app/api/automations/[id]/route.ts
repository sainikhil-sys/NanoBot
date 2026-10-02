import { NextRequest, NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";
import { parseSchedule, computeNextRun } from "@/lib/automations/cron";
import { generateWebhookSecret } from "@/lib/workflows/webhooks";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const automation = WorkflowStore.getAutomation(id);
  if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 });

  try {
    const body = await req.json();

    if (typeof body.name === "string") automation.name = body.name;
    if (typeof body.description === "string") automation.description = body.description;

    if (body.status === "active" || body.status === "paused") {
      automation.status = body.status;
    }

    // Rotate the webhook signing secret on request.
    if (body.regenerateSecret === true && automation.triggerType === "webhook") {
      automation.webhookSecret = generateWebhookSecret();
    }

    if (typeof body.schedule === "string" && automation.triggerType === "schedule") {
      const parsed = parseSchedule(body.schedule);
      if (!parsed.valid) {
        return NextResponse.json({ error: `Invalid schedule "${body.schedule}".` }, { status: 400 });
      }
      automation.schedule = body.schedule;
    }

    // Recompute next run when active + scheduled; clear it when paused.
    if (automation.triggerType === "schedule") {
      automation.nextRunAt =
        automation.status === "active" && automation.schedule
          ? computeNextRun(automation.schedule) ?? undefined
          : undefined;
    }

    automation.updatedAt = new Date().toISOString();
    WorkflowStore.saveAutomation(automation);
    return NextResponse.json({ automation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid update" },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = WorkflowStore.deleteAutomation(id);
  if (!deleted) return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
