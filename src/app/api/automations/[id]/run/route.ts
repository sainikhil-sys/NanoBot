import { NextRequest, NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";
import { AutomationEngine } from "@/lib/automations/engine";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const automation = WorkflowStore.getAutomation(id);
  if (!automation) return NextResponse.json({ error: "Automation not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { run, error } = await AutomationEngine.run(automation, {
    payload: body.payload || {},
    trigger: "manual",
  });

  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ execution: run, automation: WorkflowStore.getAutomation(id) });
}
