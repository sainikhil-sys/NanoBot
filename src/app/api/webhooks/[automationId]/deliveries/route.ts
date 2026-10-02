import { NextRequest, NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ automationId: string }> }) {
  const { automationId } = await params;
  const deliveries = WorkflowStore.listWebhookDeliveries({ automationId, limit: 50 });
  return NextResponse.json({ deliveries });
}
