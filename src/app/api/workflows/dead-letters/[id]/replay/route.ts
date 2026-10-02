import { NextRequest, NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";
import { WorkflowEngine } from "@/lib/workflows/workflow-engine";
import { DbService } from "@/lib/supabase/db-service";

/**
 * Replay a dead-lettered job by re-executing its workflow version with the
 * original (masked) trigger input. On success the DLQ entry is marked resolved.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = WorkflowStore.getDeadLetter(id);
  if (!job) return NextResponse.json({ error: "Dead-letter job not found" }, { status: 404 });

  const originalRun = WorkflowStore.getRun(job.runId);
  const workflow = WorkflowStore.getWorkflow(job.workflowId);
  if (!workflow) {
    return NextResponse.json(
      { error: "The workflow for this job no longer exists and cannot be replayed." },
      { status: 400 }
    );
  }

  const userId = await DbService.getCurrentUserId().catch(() => undefined);
  const run = await WorkflowEngine.executeWorkflow(workflow, {
    payload: (originalRun?.triggerPayload as Record<string, unknown>) ?? {},
    userId,
    trigger: job.trigger,
    version: job.workflowVersion,
  });

  if (run.status === "completed") WorkflowStore.resolveDeadLetter(id);
  return NextResponse.json({ execution: run });
}
