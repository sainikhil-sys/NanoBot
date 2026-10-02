import { NextRequest, NextResponse } from "next/server";
import { WorkflowStore } from "@/lib/workflows/store";
import { AutomationEngine } from "@/lib/automations/engine";
import {
  verifySignature,
  deriveEventId,
  WebhookDelivery,
} from "@/lib/workflows/webhooks";

/**
 * Secure webhook intake:
 *   Receive → verify signature → derive event id → idempotency check →
 *   persist delivery → execute workflow → return result.
 *
 * Execution is synchronous and persisted (there is no separate worker tier in
 * this deployment); the run is fully recorded and inspectable in Executions.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ automationId: string }> }) {
  const { automationId } = await params;
  const now = new Date().toISOString();

  const automation = WorkflowStore.getAutomation(automationId);
  if (!automation) {
    return NextResponse.json({ error: "Unknown webhook endpoint" }, { status: 404 });
  }
  if (automation.triggerType !== "webhook") {
    return NextResponse.json({ error: "This automation is not a webhook trigger" }, { status: 400 });
  }

  const rawBody = await req.text();
  const eventId = deriveEventId(rawBody, req.headers.get("x-nanobot-event-id"));
  const deliveryBase = { id: `whd_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, automationId, eventId, receivedAt: now };

  const record = (d: Omit<WebhookDelivery, keyof typeof deliveryBase> & Partial<WebhookDelivery>) => {
    const delivery: WebhookDelivery = { ...deliveryBase, ...d } as WebhookDelivery;
    WorkflowStore.recordWebhookDelivery(delivery);
    return delivery;
  };

  // Signature verification (when a secret is configured).
  if (automation.webhookSecret) {
    const sig = req.headers.get("x-nanobot-signature");
    if (!verifySignature(rawBody, automation.webhookSecret, sig)) {
      record({ status: "rejected", reason: "invalid signature" });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  if (automation.status !== "active") {
    record({ status: "rejected", reason: "automation paused" });
    return NextResponse.json({ error: "Automation is paused" }, { status: 409 });
  }

  // Parse payload (fall back to raw text if not JSON).
  let payload: Record<string, unknown>;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
    if (typeof payload !== "object" || payload === null) payload = { value: payload };
  } catch {
    payload = { raw: rawBody };
  }

  // Idempotency: a repeated event id does not run the workflow twice.
  const idempotencyKey = `wh:${automationId}:${eventId}`;
  const existingRunId = WorkflowStore.checkIdempotency(idempotencyKey);
  if (existingRunId) {
    record({ status: "duplicate", runId: existingRunId, reason: "duplicate event id" });
    return NextResponse.json({ ok: true, duplicate: true, runId: existingRunId }, { status: 200 });
  }

  const { run, error } = await AutomationEngine.run(automation, {
    payload,
    trigger: "webhook",
    idempotencyKey,
  });

  if (error || !run) {
    record({ status: "error", reason: error || "execution error" });
    return NextResponse.json({ ok: false, error: error || "execution error" }, { status: 500 });
  }

  record({ status: "accepted", runId: run.id, reason: run.status });
  return NextResponse.json({ ok: true, runId: run.id, status: run.status }, { status: 202 });
}
