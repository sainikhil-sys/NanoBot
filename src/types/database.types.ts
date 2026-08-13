export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BotCategory =
  | "Conversational"
  | "Engineering"
  | "Computer Vision"
  | "Research"
  | "Documents"
  | "Data Science"
  | "Education";

export type BotStatus = "active" | "idle" | "busy" | "maintenance";

export type TaskStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type StepStatus = "waiting" | "running" | "completed" | "failed" | "skipped";

export type EventLevel = "info" | "warn" | "error" | "debug";

export type NotificationType =
  | "task_completed"
  | "task_failed"
  | "bot_status"
  | "system"
  | "security";

export interface Bot {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: BotCategory;
  status: BotStatus;
  capabilities: string[];
  avatar_icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  bot_id: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  task_type: string;
  input_payload?: Record<string, unknown> | null;
  result?: {
    output_text?: string;
    metrics?: Record<string, unknown>;
    artifacts?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation fields
  bot?: Bot | null;
  steps?: TaskStep[];
  events?: TaskEvent[];
}

export interface TaskStep {
  id: string;
  task_id: string;
  step_order: number;
  layer: string;
  step_name: string;
  status: StepStatus;
  progress: number;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  started_at?: string | null;
  completed_at?: string | null;
  duration_ms?: number | null;
  created_at: string;
}

export interface TaskEvent {
  id: string;
  task_id: string;
  step_id?: string | null;
  event_type: string;
  level: EventLevel;
  layer: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  bot_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  bot?: Bot;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AppFile {
  id: string;
  user_id: string;
  task_id?: string | null;
  name: string;
  path: string;
  mime_type: string;
  size: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  definition: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface SavedItem {
  id: string;
  user_id: string;
  title: string;
  item_type: "conversation" | "vector" | "document" | "code";
  content: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface VectorRecord {
  id: string;
  user_id: string;
  input_text: string;
  source_filename?: string | null;
  dimensions: number;
  magnitude: number;
  model: string;
  vector_store: string;
  chunks_count: number;
  vector: number[];
  chunks?: Array<{
    index: number;
    text: string;
    vector: number[];
    tokens: number;
  }>;
  created_at: string;
}

