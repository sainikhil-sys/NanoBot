export type WorkflowNodeType =
  | "trigger_manual"
  | "trigger_schedule"
  | "trigger_file"
  | "trigger_webhook"
  | "agent_ai"
  | "llm_completion"
  | "web_search"
  | "document_parser"
  | "embedding_generator"
  | "vector_search"
  | "code_executor"
  | "condition"
  | "http_request"
  | "database_query"
  | "email_notification"
  | "output";

export type WorkflowNodeStatus = "idle" | "running" | "success" | "failed" | "skipped";

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  description: string;
  icon: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  status?: WorkflowNodeStatus;
  durationMs?: number;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface RetryPolicy {
  /** Maximum attempts including the first. 1 = no retries. */
  maxAttempts: number;
  /** Delay before the first retry, in milliseconds. */
  initialDelayMs: number;
  /** Multiplier applied to the delay after each failed attempt. */
  backoffMultiplier: number;
  /** Upper bound for any single backoff delay, in milliseconds. */
  maxDelayMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 500,
  backoffMultiplier: 2,
  maxDelayMs: 15_000,
};

export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export interface NodeExecutionLog {
  ts: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface NodeExecutionRecord {
  nodeId: string;
  nodeTitle: string;
  nodeType: WorkflowNodeType;
  status: WorkflowNodeStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  /** Total attempts performed for this node (1 when it succeeded first try). */
  attempts?: number;
  /** Whether the final error (if any) was classified as non-retryable. */
  nonRetryable?: boolean;
  logs?: NodeExecutionLog[];
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  /** Immutable version number of the definition this run executed against. */
  workflowVersion?: number;
  userId?: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  trigger: string;
  /** The payload the trigger fired with (masked of secrets for display). */
  triggerPayload?: Record<string, unknown>;
  /** Caller-supplied key that guarantees at-most-once execution. */
  idempotencyKey?: string;
  nodeExecutions: NodeExecutionRecord[];
  error?: string;
  /** Set when the run ended in the dead-letter state. */
  deadLettered?: boolean;
}

/** An immutable snapshot of a workflow definition at publish time. */
export interface WorkflowVersion {
  workflowId: string;
  version: number;
  definition: WorkflowDefinition;
  createdAt: string;
}

export interface DeadLetterJob {
  id: string;
  runId: string;
  workflowId: string;
  workflowName: string;
  workflowVersion?: number;
  failedNodeId?: string;
  failedNodeTitle?: string;
  input: Record<string, unknown>;
  error: string;
  attempts: number;
  trigger: string;
  createdAt: string;
  resolvedAt?: string;
}

export type AutomationTriggerType =
  | "schedule"
  | "webhook"
  | "file_upload"
  | "event"
  | "manual";

export type AutomationStatus = "active" | "paused";

export interface Automation {
  id: string;
  userId?: string;
  name: string;
  description: string;
  workflowId: string;
  workflowName: string;
  triggerType: AutomationTriggerType;
  /** For schedule triggers: a cron expression or `every:<n><unit>` interval. */
  schedule?: string;
  /** For webhook triggers: shared secret used to verify inbound HMAC signatures. */
  webhookSecret?: string;
  timezone?: string;
  retryPolicy?: RetryPolicy;
  status: AutomationStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: RunStatus;
  nextRunAt?: string;
  /** Real count of executions, derived from persisted runs. Never fabricated. */
  executionCount: number;
}
