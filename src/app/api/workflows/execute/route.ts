import { NextRequest, NextResponse } from "next/server";
import { WorkflowEngine } from "@/lib/workflows/workflow-engine";
import { WorkflowDefinition } from "@/lib/workflows/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workflow: WorkflowDefinition = body.workflow;

    if (!workflow || !Array.isArray(workflow.nodes)) {
      return NextResponse.json({ error: "Valid workflow definition is required" }, { status: 400 });
    }

    const executionRecord = await WorkflowEngine.executeWorkflow(workflow, body.payload || {});

    return NextResponse.json({
      execution: executionRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Workflow execution failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const executions = WorkflowEngine.getAllExecutions();
  return NextResponse.json({ executions });
}
