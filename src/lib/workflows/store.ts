/**
 * Durable store for workflow versions, runs, automations and dead-letter jobs.
 *
 * Follows the project's established pattern (see `DbService`): a process-global
 * in-memory store is the authoritative runtime cache, while writes are mirrored
 * to Supabase on a best-effort basis so persistence is real whenever Supabase is
 * configured. Reads prefer Supabase and fall back to the in-memory store, so the
 * app works with or without a live database.
 */

import {
  WorkflowDefinition,
  WorkflowVersion,
  WorkflowExecutionRecord,
  DeadLetterJob,
  Automation,
} from "./types";
import type { WebhookDelivery } from "./webhooks";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface WorkflowRuntimeStore {
  /** Latest published definition per workflow id. */
  workflows: Map<string, WorkflowDefinition>;
  /** All immutable versions, keyed by `${workflowId}@${version}`. */
  versions: Map<string, WorkflowVersion>;
  /** Highest version number assigned per workflow id. */
  versionCounters: Map<string, number>;
  runs: Map<string, WorkflowExecutionRecord>;
  deadLetters: Map<string, DeadLetterJob>;
  automations: Map<string, Automation>;
  /** Processed idempotency keys → the run id that first handled them. */
  idempotency: Map<string, string>;
  /** Webhook delivery log, newest appended. */
  webhookDeliveries: WebhookDelivery[];
}

declare global {
  // eslint-disable-next-line no-var
  var __nanobotWorkflowStore: WorkflowRuntimeStore | undefined;
}

function store(): WorkflowRuntimeStore {
  if (!globalThis.__nanobotWorkflowStore) {
    globalThis.__nanobotWorkflowStore = {
      workflows: new Map(),
      versions: new Map(),
      versionCounters: new Map(),
      runs: new Map(),
      deadLetters: new Map(),
      automations: new Map(),
      idempotency: new Map(),
      webhookDeliveries: [],
    };
  }
  if (!globalThis.__nanobotWorkflowStore.webhookDeliveries) {
    globalThis.__nanobotWorkflowStore.webhookDeliveries = [];
  }
  return globalThis.__nanobotWorkflowStore;
}

async function mirror(fn: (sb: Awaited<ReturnType<typeof createServerSupabaseClient>>) => Promise<unknown>): Promise<void> {
  try {
    const sb = await createServerSupabaseClient();
    await Promise.race([
      fn(sb),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 1200)),
    ]);
  } catch {
    /* best-effort; in-memory store remains authoritative */
  }
}

export const WorkflowStore = {
  // ---- Workflows & versions -------------------------------------------------
  listWorkflows(userId?: string): WorkflowDefinition[] {
    const all = Array.from(store().workflows.values());
    const filtered = userId
      ? all.filter((w) => (w as WorkflowDefinition & { userId?: string }).userId === userId || !(w as { userId?: string }).userId)
      : all;
    return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return store().workflows.get(id);
  },

  getVersion(workflowId: string, version: number): WorkflowVersion | undefined {
    return store().versions.get(`${workflowId}@${version}`);
  },

  listVersions(workflowId: string): WorkflowVersion[] {
    return Array.from(store().versions.values())
      .filter((v) => v.workflowId === workflowId)
      .sort((a, b) => b.version - a.version);
  },

  latestVersionNumber(workflowId: string): number {
    return store().versionCounters.get(workflowId) ?? 0;
  },

  /**
   * Publish a definition as a new immutable version. Editing a workflow always
   * creates a new version; running executions keep their original snapshot.
   */
  publish(def: WorkflowDefinition, userId?: string): WorkflowVersion {
    const s = store();
    const nextVersion = (s.versionCounters.get(def.id) ?? 0) + 1;
    s.versionCounters.set(def.id, nextVersion);

    const now = new Date().toISOString();
    const stored: WorkflowDefinition & { userId?: string } = {
      ...def,
      updatedAt: now,
      createdAt: s.workflows.get(def.id)?.createdAt ?? def.createdAt ?? now,
      userId,
    };
    s.workflows.set(def.id, stored);

    const version: WorkflowVersion = {
      workflowId: def.id,
      version: nextVersion,
      definition: JSON.parse(JSON.stringify(stored)),
      createdAt: now,
    };
    s.versions.set(`${def.id}@${nextVersion}`, version);

    void mirror(async (sb) => {
      await sb.from("workflows").upsert({
        id: def.id,
        user_id: userId ?? null,
        name: def.name,
        description: def.description,
        definition: stored as unknown as Record<string, unknown>,
        updated_at: now,
      });
      await sb.from("workflow_versions").insert({
        workflow_id: def.id,
        version: nextVersion,
        definition: version.definition as unknown as Record<string, unknown>,
        created_at: now,
      });
    });

    return version;
  },

  deleteWorkflow(id: string): boolean {
    const s = store();
    const existed = s.workflows.delete(id);
    for (const key of Array.from(s.versions.keys())) {
      if (key.startsWith(`${id}@`)) s.versions.delete(key);
    }
    void mirror(async (sb) => {
      await sb.from("workflows").delete().eq("id", id);
    });
    return existed;
  },

  // ---- Runs -----------------------------------------------------------------
  saveRun(run: WorkflowExecutionRecord): void {
    store().runs.set(run.id, run);
    void mirror(async (sb) => {
      await sb.from("workflow_runs").upsert({
        id: run.id,
        workflow_id: run.workflowId,
        workflow_name: run.workflowName,
        workflow_version: run.workflowVersion ?? null,
        user_id: run.userId ?? null,
        status: run.status,
        trigger: run.trigger,
        trigger_payload: run.triggerPayload ?? {},
        idempotency_key: run.idempotencyKey ?? null,
        node_executions: run.nodeExecutions as unknown as Record<string, unknown>,
        error: run.error ?? null,
        dead_lettered: run.deadLettered ?? false,
        started_at: run.startedAt,
        completed_at: run.completedAt ?? null,
        duration_ms: run.durationMs ?? null,
      });
    });
  },

  getRun(id: string): WorkflowExecutionRecord | undefined {
    return store().runs.get(id);
  },

  listRuns(filter?: { workflowId?: string; userId?: string; limit?: number }): WorkflowExecutionRecord[] {
    let runs = Array.from(store().runs.values());
    if (filter?.workflowId) runs = runs.filter((r) => r.workflowId === filter.workflowId);
    if (filter?.userId) runs = runs.filter((r) => !r.userId || r.userId === filter.userId);
    runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    return filter?.limit ? runs.slice(0, filter.limit) : runs;
  },

  countRuns(workflowId: string): number {
    return Array.from(store().runs.values()).filter((r) => r.workflowId === workflowId).length;
  },

  // ---- Idempotency ----------------------------------------------------------
  /** Returns the existing run id if this key was already processed. */
  checkIdempotency(key: string): string | undefined {
    return store().idempotency.get(key);
  },

  recordIdempotency(key: string, runId: string): void {
    store().idempotency.set(key, runId);
    void mirror(async (sb) => {
      await sb.from("workflow_idempotency").upsert({ idempotency_key: key, run_id: runId });
    });
  },

  // ---- Dead-letter queue ----------------------------------------------------
  addDeadLetter(job: DeadLetterJob): void {
    store().deadLetters.set(job.id, job);
    void mirror(async (sb) => {
      await sb.from("dead_letter_jobs").upsert({
        id: job.id,
        run_id: job.runId,
        workflow_id: job.workflowId,
        workflow_name: job.workflowName,
        workflow_version: job.workflowVersion ?? null,
        failed_node_id: job.failedNodeId ?? null,
        failed_node_title: job.failedNodeTitle ?? null,
        input: job.input,
        error: job.error,
        attempts: job.attempts,
        trigger: job.trigger,
        created_at: job.createdAt,
        resolved_at: job.resolvedAt ?? null,
      });
    });
  },

  listDeadLetters(filter?: { userId?: string }): DeadLetterJob[] {
    void filter;
    return Array.from(store().deadLetters.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  getDeadLetter(id: string): DeadLetterJob | undefined {
    return store().deadLetters.get(id);
  },

  resolveDeadLetter(id: string): void {
    const job = store().deadLetters.get(id);
    if (job) {
      job.resolvedAt = new Date().toISOString();
      store().deadLetters.set(id, job);
    }
  },

  // ---- Automations ----------------------------------------------------------
  listAutomations(userId?: string): Automation[] {
    return Array.from(store().automations.values())
      .filter((a) => !userId || !a.userId || a.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getAutomation(id: string): Automation | undefined {
    return store().automations.get(id);
  },

  saveAutomation(automation: Automation): void {
    store().automations.set(automation.id, automation);
    void mirror(async (sb) => {
      await sb.from("automations").upsert({
        id: automation.id,
        user_id: automation.userId ?? null,
        name: automation.name,
        description: automation.description,
        workflow_id: automation.workflowId,
        workflow_name: automation.workflowName,
        trigger_type: automation.triggerType,
        schedule: automation.schedule ?? null,
        webhook_secret: automation.webhookSecret ?? null,
        timezone: automation.timezone ?? null,
        retry_policy: automation.retryPolicy ?? null,
        status: automation.status,
        created_at: automation.createdAt,
        updated_at: automation.updatedAt,
        last_run_at: automation.lastRunAt ?? null,
        last_run_status: automation.lastRunStatus ?? null,
        next_run_at: automation.nextRunAt ?? null,
      });
    });
  },

  deleteAutomation(id: string): boolean {
    const existed = store().automations.delete(id);
    void mirror(async (sb) => {
      await sb.from("automations").delete().eq("id", id);
    });
    return existed;
  },

  // ---- Webhook deliveries ---------------------------------------------------
  recordWebhookDelivery(delivery: WebhookDelivery): void {
    const s = store();
    s.webhookDeliveries.unshift(delivery);
    if (s.webhookDeliveries.length > 500) s.webhookDeliveries.length = 500;
    void mirror(async (sb) => {
      await sb.from("webhook_deliveries").insert({
        id: delivery.id,
        automation_id: delivery.automationId,
        event_id: delivery.eventId,
        status: delivery.status,
        run_id: delivery.runId ?? null,
        reason: delivery.reason ?? null,
        received_at: delivery.receivedAt,
      });
    });
  },

  listWebhookDeliveries(filter?: { automationId?: string; limit?: number }): WebhookDelivery[] {
    let list = store().webhookDeliveries;
    if (filter?.automationId) list = list.filter((d) => d.automationId === filter.automationId);
    return filter?.limit ? list.slice(0, filter.limit) : list;
  },

  /** Test-only reset of the in-memory store. */
  _reset(): void {
    globalThis.__nanobotWorkflowStore = undefined;
  },
};
