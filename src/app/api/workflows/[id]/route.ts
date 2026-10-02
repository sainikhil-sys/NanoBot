import { NextRequest, NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";
import { WorkflowDefinition } from "@/lib/workflows/types";
import { DbService } from "@/lib/supabase/db-service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = WorkflowStore.getWorkflow(id);
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  return NextResponse.json({
    workflow: { ...workflow, version: WorkflowStore.latestVersionNumber(id) },
    versions: WorkflowStore.listVersions(id).map((v) => ({ version: v.version, createdAt: v.createdAt })),
  });
}

/** Editing a workflow publishes a NEW immutable version; in-flight runs keep theirs. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = WorkflowStore.getWorkflow(id);
  if (!existing) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

  try {
    const body = await req.json();
    const userId = await DbService.getCurrentUserId().catch(() => undefined);
    const def: WorkflowDefinition = {
      ...existing,
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      nodes: Array.isArray(body.nodes) ? body.nodes : existing.nodes,
      edges: Array.isArray(body.edges) ? body.edges : existing.edges,
      id,
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = WorkflowStore.deleteWorkflow(id);
  if (!deleted) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
