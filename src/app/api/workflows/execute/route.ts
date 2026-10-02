import { NextRequest, NextResponse } from "next/server";
import { WorkflowEngine } from "@/lib/workflows/workflow-engine";
import { WorkflowStore } from "@/lib/workflows/store";
import { WorkflowDefinition } from "@/lib/workflows/types";
import { DbService } from "@/lib/supabase/db-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept either a workflow id (runs the latest published version) or an
    // inline definition (used by the builder's "test run").
    let workflow: WorkflowDefinition | undefined = body.workflow;
    let version: number | undefined;

    if (!workflow && body.workflowId) {
      workflow = WorkflowStore.getWorkflow(body.workflowId);
      version = WorkflowStore.latestVersionNumber(body.workflowId);
    }

    if (!workflow || !Array.isArray(workflow.nodes)) {
      return NextResponse.json(
        { error: "Provide a valid 'workflow' definition or a known 'workflowId'." },
        { status: 400 }
      );
    }

    const userId = await DbService.getCurrentUserId().catch(() => undefined);
    const run = await WorkflowEngine.executeWorkflow(workflow, {
      payload: body.payload || {},
      userId,
      trigger: body.trigger || "manual",
      idempotencyKey: body.idempotencyKey,
      version,
    });

    const status = run.status === "failed" ? 207 : 200; // 207: completed with failure recorded
    return NextResponse.json({ execution: run }, { status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Workflow execution failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const userId = await DbService.getCurrentUserId().catch(() => undefined);
  const executions = WorkflowEngine.getAllExecutions(userId);
  return NextResponse.json({ executions });
}
