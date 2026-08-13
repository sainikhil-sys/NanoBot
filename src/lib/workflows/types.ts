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
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  trigger: string;
  nodeExecutions: NodeExecutionRecord[];
  error?: string;
}
