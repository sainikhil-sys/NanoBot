import { describe, it, expect, beforeEach } from "vitest";
import {
  generateWebhookSecret,
  signPayload,
  verifySignature,
  deriveEventId,
} from "../src/lib/workflows/webhooks";
import { WorkflowStore } from "../src/lib/workflows/store";
import { POST } from "../src/app/api/webhooks/[automationId]/route";
import { WorkflowDefinition, Automation } from "../src/lib/workflows/types";

function seedWebhookAutomation(secret?: string): Automation {
  const def: WorkflowDefinition = {
    id: "wf-hook",
    name: "Hook WF",
    description: "",
    nodes: [
      { id: "n1", type: "trigger_webhook", title: "t", description: "", icon: "", config: {}, position: { x: 0, y: 0 } },
      { id: "n2", type: "output", title: "o", description: "", icon: "", config: {}, position: { x: 0, y: 0 } },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2" }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  WorkflowStore.publish(def);
  const now = new Date().toISOString();
  const automation: Automation = {
    id: "auto-hook",
    name: "Hook",
    description: "",
    workflowId: "wf-hook",
    workflowName: "Hook WF",
    triggerType: "webhook",
    webhookSecret: secret,
    status: "active",
    createdAt: now,
    updatedAt: now,
    executionCount: 0,
  };
  WorkflowStore.saveAutomation(automation);
  return automation;
}

function makeReq(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/webhooks/auto-hook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  }) as unknown as import("next/server").NextRequest;
}

const params = Promise.resolve({ automationId: "auto-hook" });

describe("webhook signing", () => {
  it("verifies a correct signature and rejects a tampered body", () => {
    const secret = generateWebhookSecret();
    const body = JSON.stringify({ hello: "world" });
    const sig = signPayload(body, secret);
    expect(verifySignature(body, secret, sig)).toBe(true);
    expect(verifySignature(body + "x", secret, sig)).toBe(false);
    expect(verifySignature(body, secret, null)).toBe(false);
    expect(verifySignature(body, secret, "sha256=deadbeef")).toBe(false);
  });

  it("derives a stable event id from the body and honors an explicit id", () => {
    const body = JSON.stringify({ a: 1 });
    expect(deriveEventId(body, null)).toBe(deriveEventId(body, null));
    expect(deriveEventId(body, "custom-123")).toBe("custom-123");
  });
});

describe("webhook intake pipeline", () => {
  beforeEach(() => WorkflowStore._reset());

  it("rejects an invalid signature with 401 and logs the delivery", async () => {
    seedWebhookAutomation("whsec_test");
    const res = await POST(makeReq(JSON.stringify({ x: 1 }), { "x-nanobot-signature": "sha256=bad" }), { params });
    expect(res.status).toBe(401);
    const deliveries = WorkflowStore.listWebhookDeliveries({ automationId: "auto-hook" });
    expect(deliveries[0].status).toBe("rejected");
  });

  it("accepts a signed webhook, executes once, and is idempotent on replay", async () => {
    const secret = "whsec_test";
    seedWebhookAutomation(secret);
    const body = JSON.stringify({ issue: { priority: 9 } });
    const sig = signPayload(body, secret);

    const first = await POST(makeReq(body, { "x-nanobot-signature": sig, "x-nanobot-event-id": "evt-1" }), { params });
    expect(first.status).toBe(202);
    const firstJson = await first.json();
    expect(firstJson.runId).toBeDefined();

    // Replay the exact same event id → no second run.
    const second = await POST(makeReq(body, { "x-nanobot-signature": sig, "x-nanobot-event-id": "evt-1" }), { params });
    const secondJson = await second.json();
    expect(secondJson.duplicate).toBe(true);
    expect(secondJson.runId).toBe(firstJson.runId);

    expect(WorkflowStore.listRuns({ workflowId: "wf-hook" }).length).toBe(1);
    const deliveries = WorkflowStore.listWebhookDeliveries({ automationId: "auto-hook" });
    expect(deliveries.map((d) => d.status)).toContain("accepted");
    expect(deliveries.map((d) => d.status)).toContain("duplicate");
  });

  it("rejects when the automation is paused", async () => {
    const a = seedWebhookAutomation();
    a.status = "paused";
    WorkflowStore.saveAutomation(a);
    const res = await POST(makeReq(JSON.stringify({ x: 1 })), { params });
    expect(res.status).toBe(409);
  });

  it("404s for an unknown endpoint", async () => {
    WorkflowStore._reset();
    const res = await POST(makeReq(JSON.stringify({ x: 1 })), { params });
    expect(res.status).toBe(404);
  });
});
