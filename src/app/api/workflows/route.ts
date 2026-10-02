import { NextRequest, NextResponse } from "next/server";
import { WorkflowDefinition } from "@/lib/workflows/types";
import { WorkflowStore } from "@/lib/workflows/store";
import { DEFAULT_WORKFLOWS } from "@/lib/workflows/seed";
import { DbService } from "@/lib/supabase/db-service";

/** Ensure the store is seeded once with the starter workflow templates. */
function ensureSeeded() {
  if (WorkflowStore.listWorkflows().length === 0) {
    for (const def of DEFAULT_WORKFLOWS) WorkflowStore.publish(def);
  }
}

export async function GET() {
  ensureSeeded();
  const workflows = WorkflowStore.listWorkflows();
  return NextResponse.json({
    workflows: workflows.map((w) => ({
      ...w,
      version: WorkflowStore.latestVersionNumber(w.id),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    ensureSeeded();
    const body = await req.json();
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "A workflow 'name' is required." }, { status: 400 });
    }
    const userId = await DbService.getCurrentUserId().catch(() => undefined);

    const now = new Date().toISOString();
    const def: WorkflowDefinition = {
      id: body.id || `wf-${Date.now()}`,
      name: body.name,
      description: body.description || "",
      nodes: Array.isArray(body.nodes) ? body.nodes : [],
      edges: Array.isArray(body.edges) ? body.edges : [],
      createdAt: now,
      updatedAt: now,
    };

    const version = WorkflowStore.publish(def, userId);
    return NextResponse.json({ workflow: { ...def, version: version.version } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid workflow data" },
      { status: 400 }
    );
  }
}
