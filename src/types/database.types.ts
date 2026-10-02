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

export type PersonalTaskPriority = "low" | "medium" | "high" | "urgent";
export type PersonalTaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type PersonalTaskSource = "manual" | "email" | "chat" | "calendar" | "workflow";

export interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority: PersonalTaskPriority;
  status: PersonalTaskStatus;
  category: string;
  source_type: PersonalTaskSource;
  source_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type MemoryCategory =
  | "profile"
  | "preferences"
  | "people"
  | "projects"
  | "meetings"
  | "tasks"
  | "communication_style"
  | "important_dates";

export interface PersonalMemory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
  is_pinned: boolean;
  is_disabled: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  provider: "google" | "linkedin" | "github" | "custom";
  provider_account_id?: string | null;
  email?: string | null;
  scopes: string[];
  access_token_encrypted?: string | null;
  refresh_token_encrypted?: string | null;
  token_expires_at?: string | null;
  status: "connected" | "disconnected" | "expired" | "error";
  last_synced_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  user_id: string;
  tool_name: string;
  permission_level: "READ" | "PREPARE" | "EXECUTE";
  action_type: string;
  description: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "expired";
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  tool: string;
  target?: string | null;
  permission_level: "READ" | "PREPARE" | "EXECUTE";
  approval_status: "auto" | "user_approved" | "rejected";
  result_status: "success" | "failed";
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface DailyBriefing {
  id: string;
  user_id: string;
  date: string;
  summary: string;
  email_highlights: Array<{
    id: string;
    subject: string;
    from: string;
    category: string;
    urgency: "high" | "medium" | "low";
    summary: string;
    actionRequired?: string;
  }>;
  calendar_highlights: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    attendees: string[];
    prepNotes?: string;
  }>;
  task_highlights: Array<{
    id: string;
    title: string;
    dueDate?: string;
    priority: PersonalTaskPriority;
    isOverdue?: boolean;
  }>;
  recommendations: string[];
  created_at: string;
}

export interface EmailClassification {
  category:
    | "URGENT"
    | "ACTION_REQUIRED"
    | "WAITING_FOR_RESPONSE"
    | "MEETING"
    | "DEADLINE"
    | "PROJECT"
    | "PERSONAL"
    | "UNIVERSITY"
    | "FINANCIAL"
    | "PROMOTIONAL"
    | "INFORMATIONAL"
    | "LOW_PRIORITY";
  importanceScore: number; // 0-100
  urgencyScore: number; // 0-100
  responseRequired: boolean;
  detectedDeadline?: string | null;
  detectedAction?: string | null;
  summary: string;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  snippet: string;
  bodyText: string;
  date: string;
  isUnread: boolean;
  isStarred: boolean;
  labels: string[];
  classification: EmailClassification;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  attendees: Array<{ email: string; name?: string; responseStatus?: string }>;
  meetLink?: string;
  isUpcoming: boolean;
  prepNotes?: string;
}

export interface DriveDocumentItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
  summary?: string;
}


