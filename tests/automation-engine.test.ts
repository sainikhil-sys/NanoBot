import { describe, it, expect, beforeEach } from "vitest";
import { WorkflowStore } from "../src/lib/workflows/store";
import { AutomationEngine } from "../src/lib/automations/engine";
import { assertSafeUrl, SsrfBlockedError } from "../src/lib/workflows/ssrf";
import { WorkflowDefinition, Automation } from "../src/lib/workflows/types";

function seedWorkflow(id: string): WorkflowDefinition {
  const def: WorkflowDefinition = {
    id,
    name: "Auto WF",
    description: "",
    nodes: [
      { id: "n1", type: "trigger_schedule", title: "t", description: "", icon: "", config: {}, position: { x: 0, y: 0 } },
      { id: "n2", type: "output", title: "o", description: "", icon: "", config: {}, position: { x: 0, y: 0 } },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2" }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  WorkflowStore.publish(def);
  return def;
}

function makeAutomation(workflowId: string, overrides: Partial<Automation> = {}): Automation {
  const now = new Date().toISOString();
  const automation: Automation = {
    id: `auto-${Math.random().toString(36).slice(2)}`,
    name: "Auto",
    description: "",
    workflowId,
    workflowName: "Auto WF",
    triggerType: "schedule",
    schedule: "every:5m",
    status: "active",
    createdAt: now,
    updatedAt: now,
    executionCount: 0,
    ...overrides,
  };
  WorkflowStore.saveAutomation(automation);
  return automation;
}

describe("automation engine", () => {
  beforeEach(() => WorkflowStore._reset());

  it("runs an automation and records a real execution count", async () => {
    seedWorkflow("wf-a");
    const automation = makeAutomation("wf-a");
    const { run, error } = await AutomationEngine.run(automation, { sleep: async () => {} });
    expect(error).toBeUndefined();
    expect(run?.status).toBe("completed");

    const updated = WorkflowStore.getAutomation(automation.id)!;
    expect(updated.executionCount).toBe(1);
    expect(updated.lastRunStatus).toBe("completed");
    expect(updated.nextRunAt).toBeDefined();
  });

  it("errors (not fabricates) when the workflow is missing", async () => {
    const automation = makeAutomation("wf-does-not-exist");
    const { run, error } = await AutomationEngine.run(automation);
    expect(run).toBeUndefined();
    expect(error).toMatch(/no longer exists/);
    expect(WorkflowStore.getAutomation(automation.id)!.lastRunStatus).toBe("failed");
  });

  it("tick processes only due, active, scheduled automations", async () => {
    seedWorkflow("wf-b");
    const past = new Date(Date.now() - 60_000).toISOString();
    const future = new Date(Date.now() + 3_600_000).toISOString();

    const due = makeAutomation("wf-b", { nextRunAt: past });
    makeAutomation("wf-b", { nextRunAt: future }); // not due
    makeAutomation("wf-b", { nextRunAt: past, status: "paused" }); // paused

    const result = await AutomationEngine.tick();
    expect(result.processed).toEqual([due.id]);
    expect(result.results[due.id]).toBe("completed");
  });
});

describe("SSRF guard", () => {
  it("blocks loopback, private and metadata addresses", async () => {
    await expect(assertSafeUrl("http://localhost:3000")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("http://127.0.0.1/admin")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("http://169.254.169.254/latest/meta-data")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("http://10.0.0.5")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("http://192.168.1.1")).rejects.toBeInstanceOf(SsrfBlockedError);
  });

  it("blocks non-http(s) schemes", async () => {
    await expect(assertSafeUrl("file:///etc/passwd")).rejects.toBeInstanceOf(SsrfBlockedError);
    await expect(assertSafeUrl("ftp://example.com")).rejects.toBeInstanceOf(SsrfBlockedError);
  });
});
