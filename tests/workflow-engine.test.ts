import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resolvePath,
  interpolateString,
  interpolateValue,
  MissingVariableError,
} from "../src/lib/workflows/variables";
import { evaluateCondition } from "../src/lib/workflows/conditions";
import {
  withRetry,
  computeBackoff,
  isRetryableError,
  NonRetryableError,
  HttpError,
} from "../src/lib/workflows/retry";
import { DEFAULT_RETRY_POLICY, WorkflowDefinition } from "../src/lib/workflows/types";
import { parseSchedule, computeNextRun } from "../src/lib/automations/cron";
import { WorkflowEngine, maskSecrets } from "../src/lib/workflows/workflow-engine";
import { WorkflowStore } from "../src/lib/workflows/store";

const noSleep = async () => {};

function wf(partial: Partial<WorkflowDefinition> & Pick<WorkflowDefinition, "id" | "nodes" | "edges">): WorkflowDefinition {
  return {
    name: partial.name ?? "Test Workflow",
    description: partial.description ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  } as WorkflowDefinition;
}

function node(id: string, type: string, config: Record<string, unknown> = {}, title = id) {
  return { id, type, title, description: "", icon: "", config, position: { x: 0, y: 0 } } as never;
}

describe("variable interpolation", () => {
  const ctx = {
    trigger: { email: { subject: "Hello" }, priority: 8 },
    nodes: { classifier: { output: { category: "critical" } } },
    items: [{ id: "a" }, { id: "b" }],
  };

  it("resolves nested and array paths", () => {
    expect(resolvePath(ctx, "trigger.email.subject")).toEqual({ found: true, value: "Hello" });
    expect(resolvePath(ctx, "items.1.id")).toEqual({ found: true, value: "b" });
    expect(resolvePath(ctx, "nodes.classifier.output.category").value).toBe("critical");
  });

  it("reports missing paths", () => {
    expect(resolvePath(ctx, "trigger.missing").found).toBe(false);
    expect(resolvePath(ctx, "items.9.id").found).toBe(false);
  });

  it("returns raw typed value for a single expression", () => {
    expect(interpolateString("{{trigger.priority}}", ctx)).toBe(8);
    expect(interpolateString("{{nodes.classifier.output}}", ctx)).toEqual({ category: "critical" });
  });

  it("substitutes embedded expressions as strings", () => {
    expect(interpolateString("Subject: {{trigger.email.subject}} ({{trigger.priority}})", ctx)).toBe(
      "Subject: Hello (8)"
    );
  });

  it("throws MissingVariableError instead of returning undefined", () => {
    expect(() => interpolateString("{{trigger.nope}}", ctx)).toThrow(MissingVariableError);
    expect(() => interpolateValue({ a: "{{trigger.nope}}" }, ctx)).toThrow(MissingVariableError);
  });
});

describe("condition evaluation", () => {
  const ctx = {
    ai: { category: "critical" },
    issue: { priority: 9 },
    email: { from: "dev@company.com" },
    flags: { urgent: true, calm: false },
  };

  it("evaluates equality and inequality", () => {
    expect(evaluateCondition('{{ai.category}} == "critical"', ctx)).toBe(true);
    expect(evaluateCondition('{{ai.category}} != "low"', ctx)).toBe(true);
  });

  it("evaluates numeric comparisons", () => {
    expect(evaluateCondition("{{issue.priority}} > 7", ctx)).toBe(true);
    expect(evaluateCondition("{{issue.priority}} <= 5", ctx)).toBe(false);
  });

  it("evaluates contains", () => {
    expect(evaluateCondition('{{email.from}} contains "@company.com"', ctx)).toBe(true);
    expect(evaluateCondition('{{email.from}} contains "@gmail.com"', ctx)).toBe(false);
  });

  it("evaluates bare truthiness and empty expressions", () => {
    expect(evaluateCondition("{{flags.urgent}}", ctx)).toBe(true);
    expect(evaluateCondition("{{flags.calm}}", ctx)).toBe(false);
    expect(evaluateCondition("", ctx)).toBe(true);
    expect(evaluateCondition(undefined, ctx)).toBe(true);
  });

  it("propagates missing variables as errors", () => {
    expect(() => evaluateCondition("{{missing.value}} == 1", ctx)).toThrow(MissingVariableError);
  });
});

describe("retry policy", () => {
  it("computes exponential backoff capped at maxDelayMs", () => {
    const p = { maxAttempts: 5, initialDelayMs: 100, backoffMultiplier: 2, maxDelayMs: 500 };
    expect(computeBackoff(1, p)).toBe(100);
    expect(computeBackoff(2, p)).toBe(200);
    expect(computeBackoff(3, p)).toBe(400);
    expect(computeBackoff(4, p)).toBe(500); // capped
  });

  it("classifies retryable vs non-retryable errors", () => {
    expect(isRetryableError(new HttpError(429, "rate"))).toBe(true);
    expect(isRetryableError(new HttpError(500, "boom"))).toBe(true);
    expect(isRetryableError(new HttpError(404, "nope"))).toBe(false);
    expect(isRetryableError(new NonRetryableError("bad config"))).toBe(false);
    expect(isRetryableError(new MissingVariableError("x"))).toBe(false);
  });

  it("retries a transient failure then succeeds", async () => {
    let calls = 0;
    const { value, attempts } = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) throw new HttpError(500, "transient");
        return "ok";
      },
      { sleep: noSleep }
    );
    expect(value).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry a non-retryable error", async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw new NonRetryableError("permanent");
        },
        { sleep: noSleep }
      )
    ).rejects.toThrow("permanent");
    expect(calls).toBe(1);
  });

  it("exhausts retries and rethrows with attempt count", async () => {
    const policy = { ...DEFAULT_RETRY_POLICY, maxAttempts: 3 };
    await expect(
      withRetry(async () => { throw new HttpError(503, "down"); }, { policy, sleep: noSleep })
    ).rejects.toMatchObject({ attempts: 3 });
  });
});

describe("cron / schedule", () => {
  it("parses interval and cron schedules", () => {
    expect(parseSchedule("every:5m").valid).toBe(true);
    expect(parseSchedule("0 9 * * 1-5").valid).toBe(true);
    expect(parseSchedule("not a schedule").valid).toBe(false);
  });

  it("computes next interval run", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    expect(computeNextRun("every:30m", from)).toBe("2026-01-01T00:30:00.000Z");
  });

  it("computes next cron run on a weekday at 09:00", () => {
    // 2026-01-01 is a Thursday.
    const from = new Date("2026-01-01T10:00:00.000Z");
    const next = computeNextRun("0 9 * * 1-5", from);
    expect(next).not.toBeNull();
    const d = new Date(next!);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(0);
    expect([1, 2, 3, 4, 5]).toContain(d.getDay());
  });
});

describe("secret masking", () => {
  it("redacts secret-looking keys recursively", () => {
    const masked = maskSecrets({
      url: "https://x.test",
      headers: { Authorization: "Bearer abc", "X-Api-Key": "k" },
      nested: { password: "p" },
    }) as Record<string, Record<string, string>>;
    expect(masked.url).toBe("https://x.test");
    expect(masked.headers.Authorization).toBe("••••••••");
    expect(masked.headers["X-Api-Key"]).toBe("••••••••");
    expect(masked.nested.password).toBe("••••••••");
  });
});

describe("workflow engine", () => {
  beforeEach(() => WorkflowStore._reset());

  it("runs a linear workflow to completion and persists the run", async () => {
    const def = wf({
      id: "wf-linear",
      nodes: [node("n1", "trigger_manual"), node("n2", "output")],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
    });
    const run = await WorkflowEngine.executeWorkflow(def, { payload: { hello: "world" }, sleep: noSleep });
    expect(run.status).toBe("completed");
    expect(run.nodeExecutions.map((n) => n.status)).toEqual(["success", "success"]);
    expect(WorkflowStore.getRun(run.id)?.status).toBe("completed");
  });

  it("follows only edges whose condition passes (branching)", async () => {
    const def = wf({
      id: "wf-branch",
      nodes: [
        node("n1", "trigger_manual"),
        node("n2", "code_executor", { language: "javascript", code: "return 10;" }),
        node("n3", "output", {}, "branch_a"),
        node("n4", "output", {}, "branch_b"),
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3", condition: "{{nodes.n2.output.result}} == 10" },
        { id: "e3", source: "n2", target: "n4", condition: "{{nodes.n2.output.result}} != 10" },
      ],
    });
    const run = await WorkflowEngine.executeWorkflow(def, { sleep: noSleep });
    expect(run.status).toBe("completed");
    const byId = Object.fromEntries(run.nodeExecutions.map((n) => [n.nodeId, n.status]));
    expect(byId.n2).toBe("success");
    expect(byId.n3).toBe("success");
    expect(byId.n4).toBe("skipped");
  });

  it("fails with a structured error and dead-letters on a missing variable", async () => {
    const def = wf({
      id: "wf-missing",
      nodes: [
        node("n1", "trigger_manual"),
        node("n2", "code_executor", { language: "javascript", code: "{{trigger.doesNotExist}}" }),
      ],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
    });
    const run = await WorkflowEngine.executeWorkflow(def, { payload: {}, sleep: noSleep });
    expect(run.status).toBe("failed");
    expect(run.deadLettered).toBe(true);
    const failed = run.nodeExecutions.find((n) => n.nodeId === "n2");
    expect(failed?.status).toBe("failed");
    expect(failed?.nonRetryable).toBe(true);
    expect(WorkflowStore.listDeadLetters().length).toBe(1);
    expect(WorkflowStore.listDeadLetters()[0].failedNodeId).toBe("n2");
  });

  it("dead-letters a permanently failing node (email with no provider)", async () => {
    delete process.env.RESEND_API_KEY;
    const def = wf({
      id: "wf-email",
      nodes: [
        node("n1", "trigger_manual"),
        node("n2", "email_notification", { to: "a@b.com", subject: "Hi", body: "x" }),
      ],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
    });
    const run = await WorkflowEngine.executeWorkflow(def, { sleep: noSleep });
    expect(run.status).toBe("failed");
    const failed = run.nodeExecutions.find((n) => n.nodeId === "n2");
    expect(failed?.attempts).toBe(1); // non-retryable, no wasted retries
    expect(WorkflowStore.listDeadLetters().length).toBe(1);
  });

  it("enforces idempotency — a duplicate key returns the original run", async () => {
    const def = wf({
      id: "wf-idem",
      nodes: [node("n1", "trigger_webhook"), node("n2", "output")],
      edges: [{ id: "e1", source: "n1", target: "n2" }],
    });
    const first = await WorkflowEngine.executeWorkflow(def, { idempotencyKey: "evt-123", trigger: "webhook", sleep: noSleep });
    const second = await WorkflowEngine.executeWorkflow(def, { idempotencyKey: "evt-123", trigger: "webhook", sleep: noSleep });
    expect(second.id).toBe(first.id);
    expect(WorkflowStore.listRuns({ workflowId: "wf-idem" }).length).toBe(1);
  });

  it("rejects a workflow graph with a cycle", async () => {
    const def = wf({
      id: "wf-cycle",
      nodes: [node("n1", "trigger_manual"), node("n2", "output"), node("n3", "output")],
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n3" },
        { id: "e3", source: "n3", target: "n2" },
      ],
    });
    const run = await WorkflowEngine.executeWorkflow(def, { sleep: noSleep });
    expect(run.status).toBe("failed");
    expect(run.error).toMatch(/cycle/i);
  });
});
