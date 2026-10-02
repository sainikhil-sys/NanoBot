/**
 * NanoBot workflow execution engine.
 *
 * Executes a workflow DAG by following edges from its trigger, with conditional
 * branching, `{{variable}}` interpolation, per-node retries with exponential
 * backoff, idempotency, dead-letter capture and full run-trace persistence.
 *
 * Runs execute against an immutable version snapshot: editing a workflow creates
 * a new version (see {@link WorkflowStore.publish}) and never mutates a run in
 * flight.
 */

import {
  WorkflowDefinition,
  WorkflowExecutionRecord,
  NodeExecutionRecord,
  NodeExecutionLog,
  WorkflowNode,
  RetryPolicy,
  DEFAULT_RETRY_POLICY,
  DeadLetterJob,
} from "./types";
import { WorkflowStore } from "./store";
import { interpolateValue } from "./variables";
import { evaluateCondition } from "./conditions";
import { withRetry, NonRetryableError, isRetryableError } from "./retry";
import { getNodeExecutor } from "./node-executors";

const SECRET_KEY_PATTERN = /(authorization|api[-_]?key|token|password|secret|bearer|cookie)/i;

/** Recursively redact secret-looking values for safe display/storage in traces. */
export function maskSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEY_PATTERN.test(k) ? "••••••••" : maskSecrets(v);
    }
    return out;
  }
  return value;
}

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export interface ExecuteOptions {
  payload?: Record<string, unknown>;
  userId?: string;
  userEmail?: string;
  trigger?: string;
  idempotencyKey?: string;
  version?: number;
  retryPolicy?: RetryPolicy;
  /** Injectable sleep for deterministic tests. */
  sleep?: (ms: number) => Promise<void>;
}

interface TopoResult {
  order: string[];
  incoming: Map<string, string[]>;
}

/** Kahn topological sort. Throws on cycles. */
function topoSort(def: WorkflowDefinition): TopoResult {
  const incoming = new Map<string, string[]>();
  const outgoingCount = new Map<string, number>();
  const nodeIds = new Set(def.nodes.map((n) => n.id));

  for (const n of def.nodes) {
    incoming.set(n.id, []);
    outgoingCount.set(n.id, 0);
  }
  for (const e of def.edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) continue;
    incoming.get(e.target)!.push(e.source);
    outgoingCount.set(e.source, (outgoingCount.get(e.source) ?? 0) + 1);
  }

  const indegree = new Map<string, number>();
  for (const n of def.nodes) indegree.set(n.id, incoming.get(n.id)!.length);

  const queue = def.nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const e of def.edges) {
      if (e.source !== id) continue;
      const deg = (indegree.get(e.target) ?? 0) - 1;
      indegree.set(e.target, deg);
      if (deg === 0) queue.push(e.target);
    }
  }

  if (order.length !== def.nodes.length) {
    throw new NonRetryableError("Workflow graph contains a cycle and cannot be executed.");
  }
  return { order, incoming };
}

declare global {
  // eslint-disable-next-line no-var
  var __nanobotWorkflowExecutions: WorkflowExecutionRecord[] | undefined;
}

export class WorkflowEngine {
  static getAllExecutions(userId?: string): WorkflowExecutionRecord[] {
    return WorkflowStore.listRuns({ userId });
  }

  static getExecutionById(id: string): WorkflowExecutionRecord | undefined {
    return WorkflowStore.getRun(id);
  }

  static async executeWorkflow(
    workflow: WorkflowDefinition,
    optionsOrPayload: ExecuteOptions | Record<string, unknown> = {}
  ): Promise<WorkflowExecutionRecord> {
    // Backward-compatible signature: second arg may be a raw payload.
    const options: ExecuteOptions =
      "payload" in optionsOrPayload ||
      "userId" in optionsOrPayload ||
      "idempotencyKey" in optionsOrPayload ||
      "trigger" in optionsOrPayload
        ? (optionsOrPayload as ExecuteOptions)
        : { payload: optionsOrPayload as Record<string, unknown> };

    // Idempotency: an already-processed key returns the original run.
    if (options.idempotencyKey) {
      const existingId = WorkflowStore.checkIdempotency(options.idempotencyKey);
      if (existingId) {
        const existing = WorkflowStore.getRun(existingId);
        if (existing) return existing;
      }
    }

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = new Date().toISOString();
    const startPerf = performance.now();
    const triggerPayload = options.payload ?? {};
    const triggerType =
      options.trigger ||
      (workflow.nodes.find((n) => n.type.startsWith("trigger_"))?.type || "trigger_manual").replace("trigger_", "");

    const run: WorkflowExecutionRecord = {
      id: runId,
      workflowId: workflow.id,
      workflowName: workflow.name,
      workflowVersion: options.version,
      userId: options.userId,
      status: "running",
      startedAt,
      trigger: triggerType,
      triggerPayload: maskSecrets(triggerPayload) as Record<string, unknown>,
      idempotencyKey: options.idempotencyKey,
      nodeExecutions: [],
    };
    WorkflowStore.saveRun(run);
    if (options.idempotencyKey) WorkflowStore.recordIdempotency(options.idempotencyKey, runId);

    // Run context used for variable interpolation and condition evaluation.
    const context: Record<string, unknown> = {
      trigger: triggerPayload,
      nodes: {} as Record<string, { output: unknown }>,
      workflow: { id: workflow.id, name: workflow.name, version: options.version, run_id: runId },
      user: { id: options.userId, email: options.userEmail },
      execution: { started_at: startedAt },
    };
    const nodesCtx = context.nodes as Record<string, { output: unknown }>;

    let topo: TopoResult;
    try {
      topo = topoSort(workflow);
    } catch (err) {
      return this.finalizeFailure(run, startPerf, err, undefined, triggerPayload);
    }

    const nodeById = new Map(workflow.nodes.map((n) => [n.id, n]));
    const succeeded = new Set<string>();
    const activeEdgeTargets = new Set<string>(); // targets reachable via a passed edge

    try {
      for (const nodeId of topo.order) {
        const node = nodeById.get(nodeId)!;
        const deps = topo.incoming.get(nodeId) ?? [];

        // Reachability: start nodes always run; others need an active incoming edge.
        const isStart = deps.length === 0;
        const reachable = isStart || activeEdgeTargets.has(nodeId);
        if (!reachable) {
          run.nodeExecutions.push({
            nodeId: node.id,
            nodeTitle: node.title,
            nodeType: node.type,
            status: "skipped",
            startedAt: new Date().toISOString(),
            input: {},
          });
          continue;
        }

        const nodeRecord = await this.runNode(node, context, options);
        run.nodeExecutions.push(nodeRecord);
        WorkflowStore.saveRun(run);

        if (nodeRecord.status === "failed") {
          throw Object.assign(new Error(nodeRecord.error || "Node failed"), {
            __nodeId: node.id,
            __nodeTitle: node.title,
            __attempts: nodeRecord.attempts,
            __nonRetryable: nodeRecord.nonRetryable,
            __input: nodeRecord.input,
          });
        }

        succeeded.add(node.id);
        nodesCtx[node.id] = { output: nodeRecord.output };
        const slug = slugify(node.title);
        if (slug && !(slug in nodesCtx)) nodesCtx[slug] = { output: nodeRecord.output };

        // Activate outgoing edges whose condition passes.
        for (const edge of workflow.edges) {
          if (edge.source !== node.id) continue;
          let passes = true;
          try {
            passes = evaluateCondition(edge.condition, context);
          } catch {
            passes = false;
          }
          if (passes) activeEdgeTargets.add(edge.target);
        }
      }

      run.status = "completed";
      run.completedAt = new Date().toISOString();
      run.durationMs = Number((performance.now() - startPerf).toFixed(1));
      WorkflowStore.saveRun(run);
      return run;
    } catch (err) {
      const meta = err as {
        __nodeId?: string;
        __nodeTitle?: string;
        __attempts?: number;
        __input?: Record<string, unknown>;
      };
      return this.finalizeFailure(run, startPerf, err, meta, triggerPayload);
    }
  }

  private static async runNode(
    node: WorkflowNode,
    context: Record<string, unknown>,
    options: ExecuteOptions
  ): Promise<NodeExecutionRecord> {
    const startedAt = new Date().toISOString();
    const startPerf = performance.now();
    const logs: NodeExecutionLog[] = [];
    const log = (level: NodeExecutionLog["level"], message: string) =>
      logs.push({ ts: new Date().toISOString(), level, message });

    // Triggers and terminal outputs are not retried.
    const noRetry = node.type.startsWith("trigger_") || node.type === "output";
    const configuredPolicy = (node.config.retry as RetryPolicy | undefined) || options.retryPolicy;
    const policy: RetryPolicy = noRetry
      ? { ...DEFAULT_RETRY_POLICY, maxAttempts: 1 }
      : configuredPolicy ?? DEFAULT_RETRY_POLICY;

    let interpolatedConfig: Record<string, unknown>;
    try {
      interpolatedConfig = interpolateValue(node.config, context) as Record<string, unknown>;
    } catch (err) {
      // Missing variable → structured, non-retryable failure.
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        nodeType: node.type,
        status: "failed",
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Number((performance.now() - startPerf).toFixed(1)),
        input: maskSecrets(node.config) as Record<string, unknown>,
        error: (err as Error).message,
        attempts: 1,
        nonRetryable: true,
        logs,
      };
    }

    const executor = getNodeExecutor(node.type);
    try {
      const { value: output, attempts } = await withRetry(
        () => executor({ node, config: interpolatedConfig, context, log }),
        {
          policy,
          sleep: options.sleep,
          onRetry: (attempt, delayMs, err) => {
            log("warn", `Attempt ${attempt - 1} failed (${(err as Error).message}); retrying in ${delayMs}ms`);
          },
        }
      );
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        nodeType: node.type,
        status: "success",
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Number((performance.now() - startPerf).toFixed(1)),
        input: maskSecrets(interpolatedConfig) as Record<string, unknown>,
        output: output as Record<string, unknown>,
        attempts,
        logs,
      };
    } catch (err) {
      const e = err as Error & { attempts?: number };
      log("error", e.message);
      return {
        nodeId: node.id,
        nodeTitle: node.title,
        nodeType: node.type,
        status: "failed",
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Number((performance.now() - startPerf).toFixed(1)),
        input: maskSecrets(interpolatedConfig) as Record<string, unknown>,
        error: e.message,
        attempts: e.attempts ?? policy.maxAttempts,
        nonRetryable: err instanceof NonRetryableError || !isRetryableError(err),
        logs,
      };
    }
  }

  private static finalizeFailure(
    run: WorkflowExecutionRecord,
    startPerf: number,
    err: unknown,
    meta: { __nodeId?: string; __nodeTitle?: string; __attempts?: number; __input?: Record<string, unknown> } | undefined,
    triggerPayload: Record<string, unknown>
  ): WorkflowExecutionRecord {
    run.status = "failed";
    run.completedAt = new Date().toISOString();
    run.durationMs = Number((performance.now() - startPerf).toFixed(1));
    run.error = (err as Error).message || "Workflow execution failed";
    run.deadLettered = true;

    const dlq: DeadLetterJob = {
      id: `dlq-${run.id}`,
      runId: run.id,
      workflowId: run.workflowId,
      workflowName: run.workflowName,
      workflowVersion: run.workflowVersion,
      failedNodeId: meta?.__nodeId,
      failedNodeTitle: meta?.__nodeTitle,
      input: maskSecrets(meta?.__input ?? triggerPayload) as Record<string, unknown>,
      error: run.error,
      attempts: meta?.__attempts ?? 1,
      trigger: run.trigger,
      createdAt: new Date().toISOString(),
    };
    WorkflowStore.addDeadLetter(dlq);
    WorkflowStore.saveRun(run);
    return run;
  }
}
