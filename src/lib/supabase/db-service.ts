import {
  Bot,
  Task,
  TaskStep,
  TaskEvent,
  Conversation,
  Message,
  AppFile,
  AppNotification,
  Profile,
  SavedItem,
  VectorRecord,
  PersonalTask,
  PersonalMemory,
  ConnectedAccount,
  ApprovalRequest,
  AuditLog,
  DailyBriefing,
} from "@/types/database.types";
import { SYSTEM_BOTS, getBotById, getBotBySlug } from "@/lib/bots/registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// In-memory runtime persistence store synchronized with database
interface RuntimeStore {
  tasks: Map<string, Task>;
  steps: Map<string, TaskStep[]>;
  events: Map<string, TaskEvent[]>;
  conversations: Map<string, Conversation>;
  messages: Map<string, Message[]>;
  files: Map<string, AppFile>;
  notifications: Map<string, AppNotification>;
  savedItems: Map<string, SavedItem>;
  vectors: Map<string, VectorRecord>;
  personalTasks: Map<string, PersonalTask>;
  personalMemory: Map<string, PersonalMemory>;
  connectedAccounts: Map<string, ConnectedAccount>;
  approvalRequests: Map<string, ApprovalRequest>;
  auditLogs: Map<string, AuditLog>;
  dailyBriefings: Map<string, DailyBriefing>;
  profile: Profile;
}

// Global runtime singleton across hot-reloads and Next.js route worker threads
declare global {
  // eslint-disable-next-line no-var
  var __nanobotStore: RuntimeStore | undefined;
}

/**
 * Fast Promise Timeout Wrapper to prevent remote Supabase network hangs
 */
async function withTimeout<T>(thenable: PromiseLike<T> | Promise<T>, timeoutMs = 1500): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Supabase query timed out")), timeoutMs);
  });
  return Promise.race([Promise.resolve(thenable), timeoutPromise]).finally(() => clearTimeout(timer));
}

/**
 * Self-healing store initializer: guarantees that all Maps are instantiated
 * even if hot-reloaded or re-evaluated across modules.
 */
function getStore(): RuntimeStore {
  if (!globalThis.__nanobotStore) {
    globalThis.__nanobotStore = {
      tasks: new Map(),
      steps: new Map(),
      events: new Map(),
      conversations: new Map(),
      messages: new Map(),
      files: new Map(),
      notifications: new Map(),
      savedItems: new Map(),
      vectors: new Map(),
      personalTasks: new Map(),
      personalMemory: new Map(),
      connectedAccounts: new Map(),
      approvalRequests: new Map(),
      auditLogs: new Map(),
      dailyBriefings: new Map(),
      profile: {
        id: "usr-prod-001",
        user_id: "usr-prod-001",
        display_name: "Engineering Lead",
        avatar_url: null,
        role: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  const s = globalThis.__nanobotStore;
  if (!s.tasks) s.tasks = new Map();
  if (!s.steps) s.steps = new Map();
  if (!s.events) s.events = new Map();
  if (!s.conversations) s.conversations = new Map();
  if (!s.messages) s.messages = new Map();
  if (!s.files) s.files = new Map();
  if (!s.notifications) s.notifications = new Map();
  if (!s.savedItems) s.savedItems = new Map();
  if (!s.vectors) s.vectors = new Map();
  if (!s.personalTasks) s.personalTasks = new Map();
  if (!s.personalMemory) s.personalMemory = new Map();
  if (!s.connectedAccounts) s.connectedAccounts = new Map();
  if (!s.approvalRequests) s.approvalRequests = new Map();
  if (!s.auditLogs) s.auditLogs = new Map();
  if (!s.dailyBriefings) s.dailyBriefings = new Map();

  return s;
}

export class DbService {
  // Helper to obtain current authenticated user ID or fallback to current profile
  private static async getUserId(providedUserId?: string): Promise<string> {
    if (providedUserId) return providedUserId;
    try {
      const supabase = await createServerSupabaseClient();
      const userRes = await withTimeout(supabase.auth.getUser(), 1200);
      if (userRes?.data?.user?.id) return userRes.data.user.id;
    } catch {}
    return getStore().profile.user_id;
  }

  /** Public accessor for the current authenticated user id (undefined if signed out). */
  static async getCurrentUserId(): Promise<string | undefined> {
    try {
      const supabase = await createServerSupabaseClient();
      const userRes = await withTimeout(supabase.auth.getUser(), 1200);
      return userRes?.data?.user?.id || undefined;
    } catch {
      return undefined;
    }
  }

  // Profiles
  static async getCurrentProfile(): Promise<Profile> {
    const store = getStore();
    try {
      const supabase = await createServerSupabaseClient();
      const userRes = await withTimeout(supabase.auth.getUser(), 1200);
      const user = userRes?.data?.user;
      if (user) {
        const { data: profile } = await withTimeout(
          supabase.from("profiles").select("*").eq("user_id", user.id).single(),
          1200
        );

        if (profile) return profile as Profile;
        return {
          id: user.id,
          user_id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "User",
          avatar_url: null,
          role: "member",
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    } catch {}
    return store.profile;
  }

  static async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const store = getStore();
    store.profile = {
      ...store.profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    try {
      const supabase = await createServerSupabaseClient();
      const userRes = await withTimeout(supabase.auth.getUser(), 1200);
      const user = userRes?.data?.user;
      if (user) {
        await withTimeout(
          supabase
            .from("profiles")
            .upsert({ user_id: user.id, ...updates, updated_at: new Date().toISOString() }),
          1200
        );
      }
    } catch {}
    return store.profile;
  }

  // Bots
  static async listBots(): Promise<Bot[]> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: bots, error } = await withTimeout(
        supabase.from("bots").select("*"),
        1200
      );
      if (!error && bots && bots.length > 0) {
        return bots as Bot[];
      }
    } catch {}
    return SYSTEM_BOTS;
  }

  static async getBot(idOrSlug: string): Promise<Bot | undefined> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: bot } = await withTimeout(
        supabase
          .from("bots")
          .select("*")
          .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
          .single(),
        1200
      );
      if (bot) return bot as Bot;
    } catch {}
    return getBotById(idOrSlug) || getBotBySlug(idOrSlug);
  }

  // Tasks
  static async listTasks(userId?: string): Promise<Task[]> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);
    try {
      const supabase = await createServerSupabaseClient();
      const { data: tasks, error } = await withTimeout(
        supabase
          .from("tasks")
          .select("*, bot:bots(*)")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && tasks) {
        return tasks as Task[];
      }
    } catch {}

    const list = Array.from(store.tasks.values()).filter(
      (t) => !userId || t.user_id === effectiveUserId
    );
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  static async getTask(id: string): Promise<Task | null> {
    const store = getStore();
    try {
      const supabase = await createServerSupabaseClient();
      const { data: task, error } = await withTimeout(
        supabase
          .from("tasks")
          .select("*, bot:bots(*), steps:task_steps(*), events:task_events(*)")
          .eq("id", id)
          .single(),
        1200
      );

      if (!error && task) {
        return task as Task;
      }
    } catch {}

    const task = store.tasks.get(id);
    if (!task) return null;

    const steps = store.steps.get(id) || [];
    const events = store.events.get(id) || [];
    const bot = task.bot_id ? await this.getBot(task.bot_id) : null;

    return {
      ...task,
      bot,
      steps: steps.sort((a, b) => a.step_order - b.step_order),
      events: events.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    };
  }

  static async createTask(data: {
    id: string;
    title: string;
    description?: string;
    bot_id?: string | null;
    task_type?: string;
    input_payload?: Record<string, unknown>;
  }): Promise<Task> {
    const store = getStore();
    const now = new Date().toISOString();
    const userId = await this.getUserId();
    const bot = data.bot_id ? await this.getBot(data.bot_id) : null;

    const task: Task = {
      id: data.id,
      user_id: userId,
      bot_id: data.bot_id || null,
      title: data.title,
      description: data.description || null,
      status: "running",
      task_type: data.task_type || "auto",
      input_payload: data.input_payload || {},
      result: null,
      error_message: null,
      started_at: now,
      completed_at: null,
      failed_at: null,
      created_at: now,
      updated_at: now,
      bot: bot || null,
    };

    store.tasks.set(data.id, task);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("tasks").insert({
          id: data.id,
          user_id: userId,
          bot_id: data.bot_id || null,
          title: data.title,
          description: data.description || null,
          status: "running",
          task_type: data.task_type || "auto",
          input_payload: data.input_payload || {},
          started_at: now,
          created_at: now,
          updated_at: now,
        }),
        1200
      );
    } catch {}

    return task;
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const store = getStore();
    const existing = store.tasks.get(id);
    if (existing) {
      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      store.tasks.set(id, updated);
    }

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase
          .from("tasks")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id),
        1200
      );
    } catch {}

    return store.tasks.get(id) || null;
  }

  // Task Steps
  static async addStep(step: TaskStep): Promise<void> {
    const store = getStore();
    const existing = store.steps.get(step.task_id) || [];
    existing.push(step);
    store.steps.set(step.task_id, existing);
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(supabase.from("task_steps").insert(step), 1200);
    } catch {}
  }

  static async updateStep(
    taskId: string,
    stepOrder: number,
    updates: Partial<TaskStep>
  ): Promise<void> {
    const store = getStore();
    const existing = store.steps.get(taskId) || [];
    const idx = existing.findIndex((s) => s.step_order === stepOrder);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...updates };
      store.steps.set(taskId, existing);
    }
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("task_steps").update(updates).eq("task_id", taskId).eq("step_order", stepOrder),
        1200
      );
    } catch {}
  }

  // Events
  static async addEvent(event: TaskEvent): Promise<void> {
    const store = getStore();
    const existing = store.events.get(event.task_id) || [];
    existing.push(event);
    store.events.set(event.task_id, existing);
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(supabase.from("task_events").insert(event), 1200);
    } catch {}
  }

  static async getEvents(taskId: string): Promise<TaskEvent[]> {
    const store = getStore();
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("task_events")
          .select("*")
          .eq("task_id", taskId)
          .order("created_at", { ascending: true }),
        1200
      );
      if (!error && data) return data as TaskEvent[];
    } catch {}
    return store.events.get(taskId) || [];
  }

  // Conversations & Messages
  static async listConversations(userId?: string): Promise<Conversation[]> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);
    try {
      const supabase = await createServerSupabaseClient();
      const { data: convs, error } = await withTimeout(
        supabase
          .from("conversations")
          .select("*, bot:bots(*)")
          .eq("user_id", effectiveUserId)
          .order("updated_at", { ascending: false }),
        1200
      );

      if (!error && convs) {
        return convs as Conversation[];
      }
    } catch {}

    const convs = Array.from(store.conversations.values()).filter(
      (c) => !userId || c.user_id === effectiveUserId
    );
    return convs.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  static async getConversation(id: string): Promise<Conversation | null> {
    const store = getStore();
    try {
      const supabase = await createServerSupabaseClient();
      const { data: conv, error } = await withTimeout(
        supabase
          .from("conversations")
          .select("*, bot:bots(*), messages(*)")
          .eq("id", id)
          .single(),
        1200
      );

      if (!error && conv) {
        return conv as Conversation;
      }
    } catch {}

    const conv = store.conversations.get(id);
    if (!conv) return null;
    const messages = store.messages.get(id) || [];
    const bot = await this.getBot(conv.bot_id);
    return {
      ...conv,
      bot,
      messages: messages.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    };
  }

  static async createConversation(
    botId: string,
    title: string,
    userId?: string
  ): Promise<Conversation> {
    const store = getStore();
    const id = `conv-${Date.now()}`;
    const now = new Date().toISOString();
    const effectiveUserId = await this.getUserId(userId);
    const bot = await this.getBot(botId);
    const conv: Conversation = {
      id,
      user_id: effectiveUserId,
      bot_id: botId,
      title,
      created_at: now,
      updated_at: now,
      bot,
    };
    store.conversations.set(id, conv);
    store.messages.set(id, []);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("conversations").insert({
          id,
          user_id: effectiveUserId,
          bot_id: botId,
          title,
          created_at: now,
          updated_at: now,
        }),
        1200
      );
    } catch {}

    return conv;
  }

  static async addMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Message> {
    const store = getStore();
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const msg: Message = {
      id,
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    };

    const existing = store.messages.get(conversationId) || [];
    existing.push(msg);
    store.messages.set(conversationId, existing);

    const conv = store.conversations.get(conversationId);
    if (conv) {
      conv.updated_at = new Date().toISOString();
      store.conversations.set(conversationId, conv);
    }

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("messages").insert({
          id,
          conversation_id: conversationId,
          role,
          content,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        }),
        1200
      );
    } catch {}

    return msg;
  }

  // Files
  static async listFiles(userId?: string): Promise<AppFile[]> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);
    try {
      const supabase = await createServerSupabaseClient();
      const { data: files, error } = await withTimeout(
        supabase
          .from("files")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && files) {
        return files as AppFile[];
      }
    } catch {}

    return Array.from(store.files.values())
      .filter((f) => !userId || f.user_id === effectiveUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async addFile(file: AppFile): Promise<void> {
    const store = getStore();
    store.files.set(file.id, file);
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(supabase.from("files").insert(file), 1200);
    } catch {}
  }

  // Notifications
  static async listNotifications(userId?: string): Promise<AppNotification[]> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);
    try {
      const supabase = await createServerSupabaseClient();
      const { data: notifs, error } = await withTimeout(
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && notifs) return notifs as AppNotification[];
    } catch {}

    return Array.from(store.notifications.values())
      .filter((n) => !userId || n.user_id === effectiveUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async addNotification(
    type: AppNotification["type"],
    title: string,
    message: string,
    userId?: string
  ): Promise<void> {
    const store = getStore();
    const id = `notif-${Date.now()}`;
    const effectiveUserId = await this.getUserId(userId);
    const notif: AppNotification = {
      id,
      user_id: effectiveUserId,
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
    };
    store.notifications.set(id, notif);
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(supabase.from("notifications").insert(notif), 1200);
    } catch {}
  }

  static async markNotificationRead(id: string): Promise<void> {
    const store = getStore();
    const notif = store.notifications.get(id);
    if (notif) {
      notif.read = true;
      store.notifications.set(id, notif);
    }
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("notifications").update({ read: true }).eq("id", id),
        1200
      );
    } catch {}
  }

  // Saved Items
  static async listSavedItems(userId?: string): Promise<SavedItem[]> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);
    try {
      const supabase = await createServerSupabaseClient();
      const { data: items, error } = await withTimeout(
        supabase
          .from("saved_items")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && items) return items as SavedItem[];
    } catch {}

    return Array.from(store.savedItems.values())
      .filter((item) => !userId || item.user_id === effectiveUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async saveItem(data: {
    title: string;
    item_type: SavedItem["item_type"];
    content: string;
    metadata?: Record<string, unknown>;
    userId?: string;
  }): Promise<SavedItem> {
    const store = getStore();
    const id = `saved-${Date.now()}`;
    const effectiveUserId = await this.getUserId(data.userId);
    const item: SavedItem = {
      id,
      user_id: effectiveUserId,
      title: data.title,
      item_type: data.item_type,
      content: data.content,
      metadata: data.metadata || null,
      created_at: new Date().toISOString(),
    };

    store.savedItems.set(id, item);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("saved_items").insert({
          id,
          user_id: effectiveUserId,
          title: data.title,
          item_type: data.item_type,
          content: data.content,
          metadata: data.metadata || {},
        }),
        1200
      );
    } catch {}

    return item;
  }

  static async deleteSavedItem(id: string): Promise<boolean> {
    const store = getStore();
    const deleted = store.savedItems.delete(id);
    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("saved_items").delete().eq("id", id),
        1200
      );
    } catch {}
    return deleted;
  }

  // Vector Records (Word to Vector Store)
  static async saveVectorRecord(data: Omit<VectorRecord, "id" | "user_id" | "created_at"> & { userId?: string }): Promise<VectorRecord> {
    const store = getStore();
    const id = `vec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const effectiveUserId = await this.getUserId(data.userId);

    const record: VectorRecord = {
      id,
      user_id: effectiveUserId,
      input_text: data.input_text,
      source_filename: data.source_filename || null,
      dimensions: data.dimensions,
      magnitude: data.magnitude,
      model: data.model,
      vector_store: data.vector_store,
      chunks_count: data.chunks_count,
      vector: data.vector,
      chunks: data.chunks,
      created_at: new Date().toISOString(),
    };

    store.vectors.set(id, record);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("vectors").insert({
          id,
          user_id: effectiveUserId,
          input_text: data.input_text,
          source_filename: data.source_filename || null,
          dimensions: data.dimensions,
          magnitude: data.magnitude,
          model: data.model,
          vector_store: data.vector_store,
          chunks_count: data.chunks_count,
          vector: data.vector,
          chunks: data.chunks,
        }),
        1200
      );
    } catch {}

    return record;
  }

  static async listVectorRecords(userId?: string): Promise<VectorRecord[]> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("vectors")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && data) return data as VectorRecord[];
    } catch {}

    return Array.from(store.vectors.values())
      .filter((v) => !userId || v.user_id === effectiveUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static async getVectorRecord(id: string): Promise<VectorRecord | null> {
    const store = getStore();
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("vectors")
          .select("*")
          .eq("id", id)
          .single(),
        1200
      );
      if (!error && data) return data as VectorRecord;
    } catch {}
    return store.vectors.get(id) || null;
  }

  // AI Usage & Plan Metrics
  static async getAiUsageMetrics(userId?: string): Promise<{
    plan: "Free Plan" | "Pro Plan";
    usedCredits: number;
    maxCredits: number;
    percentUsed: number;
    daysUntilReset: number;
    messages: number;
    vectors: number;
    files: number;
    saved: number;
    conversations: number;
  }> {
    const store = getStore();
    const effectiveUserId = await this.getUserId(userId);

    let totalConvs = 0;
    let totalMsgs = 0;
    let totalVectors = 0;
    let totalFiles = 0;
    let totalSaved = 0;

    try {
      const supabase = await createServerSupabaseClient();
      const [cRes, mRes, vRes, fRes, sRes] = await withTimeout(
        Promise.all([
          supabase.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", effectiveUserId),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase.from("vectors").select("id", { count: "exact", head: true }).eq("user_id", effectiveUserId),
          supabase.from("files").select("id", { count: "exact", head: true }).eq("user_id", effectiveUserId),
          supabase.from("saved_items").select("id", { count: "exact", head: true }).eq("user_id", effectiveUserId),
        ]),
        1200
      );

      totalConvs = cRes.count || 0;
      totalMsgs = mRes.count || 0;
      totalVectors = vRes.count || 0;
      totalFiles = fRes.count || 0;
      totalSaved = sRes.count || 0;
    } catch {
      totalConvs = Array.from(store.conversations.values()).filter((c) => c.user_id === effectiveUserId).length;
      totalMsgs = Array.from(store.messages.values()).reduce((sum, msgs) => sum + msgs.length, 0);
      totalVectors = Array.from(store.vectors.values()).filter((v) => v.user_id === effectiveUserId).length;
      totalFiles = Array.from(store.files.values()).filter((f) => f.user_id === effectiveUserId).length;
      totalSaved = Array.from(store.savedItems.values()).filter((s) => s.user_id === effectiveUserId).length;
    }

    const calculatedUsed = totalMsgs * 1 + totalVectors * 3 + totalFiles * 2;
    const usedCredits = Math.min(100, Math.max(12, calculatedUsed));
    const maxCredits = 100;
    const percentUsed = Math.round((usedCredits / maxCredits) * 100);

    return {
      plan: "Free Plan",
      usedCredits,
      maxCredits,
      percentUsed,
      daysUntilReset: 14,
      messages: totalMsgs,
      vectors: totalVectors,
      files: totalFiles,
      saved: totalSaved,
      conversations: totalConvs,
    };
  }

  // ============================================================
  // PERSONAL TASKS
  // ============================================================
  static async listPersonalTasks(userId?: string): Promise<PersonalTask[]> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("personal_tasks")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && data) {
        data.forEach((t: PersonalTask) => store.personalTasks.set(t.id, t));
        return data;
      }
    } catch {
      // Fall through to store
    }

    return Array.from(store.personalTasks.values())
      .filter((t) => t.user_id === effectiveUserId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  static async createPersonalTask(task: Omit<PersonalTask, "id" | "created_at" | "updated_at">): Promise<PersonalTask> {
    const store = getStore();
    const newTask: PersonalTask = {
      ...task,
      id: `ptask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.personalTasks.set(newTask.id, newTask);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("personal_tasks").insert(newTask),
        1200
      );
    } catch {
      // Retained in memory store
    }

    return newTask;
  }

  static async updatePersonalTask(id: string, updates: Partial<PersonalTask>): Promise<PersonalTask | null> {
    const store = getStore();
    const existing = store.personalTasks.get(id);
    if (!existing) return null;

    const updated: PersonalTask = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    store.personalTasks.set(id, updated);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("personal_tasks").update(updated).eq("id", id),
        1200
      );
    } catch {
      // Fall through
    }

    return updated;
  }

  static async deletePersonalTask(id: string): Promise<boolean> {
    const store = getStore();
    store.personalTasks.delete(id);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("personal_tasks").delete().eq("id", id),
        1200
      );
    } catch {
      // Fall through
    }

    return true;
  }

  // ============================================================
  // PERSONAL MEMORY
  // ============================================================
  static async listPersonalMemory(userId?: string): Promise<PersonalMemory[]> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("personal_memory")
          .select("*")
          .eq("user_id", effectiveUserId)
          .eq("is_disabled", false)
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && data) {
        data.forEach((m: PersonalMemory) => store.personalMemory.set(m.id, m));
        return data;
      }
    } catch {
      // Fall through
    }

    return Array.from(store.personalMemory.values())
      .filter((m) => m.user_id === effectiveUserId && !m.is_disabled)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  static async createPersonalMemory(memory: Omit<PersonalMemory, "id" | "created_at" | "updated_at">): Promise<PersonalMemory> {
    const store = getStore();
    const newMemory: PersonalMemory = {
      ...memory,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.personalMemory.set(newMemory.id, newMemory);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("personal_memory").insert(newMemory),
        1200
      );
    } catch {
      // Retained in memory store
    }

    return newMemory;
  }

  static async deletePersonalMemory(id: string): Promise<boolean> {
    const store = getStore();
    store.personalMemory.delete(id);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("personal_memory").delete().eq("id", id),
        1200
      );
    } catch {
      // Fall through
    }

    return true;
  }

  static async clearPersonalMemory(userId?: string): Promise<boolean> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    for (const [id, m] of store.personalMemory.entries()) {
      if (m.user_id === effectiveUserId) {
        store.personalMemory.delete(id);
      }
    }

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("personal_memory").delete().eq("user_id", effectiveUserId),
        1200
      );
    } catch {
      // Fall through
    }

    return true;
  }

  // ============================================================
  // CONNECTED ACCOUNTS
  // ============================================================
  static async listConnectedAccounts(userId?: string): Promise<ConnectedAccount[]> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("connected_accounts")
          .select("*")
          .eq("user_id", effectiveUserId),
        1200
      );

      if (!error && data) {
        data.forEach((acc: ConnectedAccount) => store.connectedAccounts.set(acc.id, acc));
        return data;
      }
    } catch {
      // Fall through
    }

    return Array.from(store.connectedAccounts.values()).filter(
      (acc) => acc.user_id === effectiveUserId
    );
  }

  static async upsertConnectedAccount(account: Omit<ConnectedAccount, "id" | "created_at" | "updated_at">): Promise<ConnectedAccount> {
    const store = getStore();
    // Check if account already exists for this provider
    const existing = Array.from(store.connectedAccounts.values()).find(
      (a) => a.user_id === account.user_id && a.provider === account.provider
    );

    const saved: ConnectedAccount = {
      ...account,
      id: existing ? existing.id : `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: existing ? existing.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.connectedAccounts.set(saved.id, saved);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("connected_accounts").upsert(saved, { onConflict: "user_id,provider" }),
        1200
      );
    } catch {
      // Retained in memory
    }

    return saved;
  }

  static async deleteConnectedAccount(provider: string, userId?: string): Promise<boolean> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    for (const [id, acc] of store.connectedAccounts.entries()) {
      if (acc.user_id === effectiveUserId && acc.provider === provider) {
        store.connectedAccounts.delete(id);
      }
    }

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("connected_accounts").delete().eq("user_id", effectiveUserId).eq("provider", provider),
        1200
      );
    } catch {
      // Fall through
    }

    return true;
  }

  // ============================================================
  // APPROVAL REQUESTS
  // ============================================================
  static async listApprovalRequests(userId?: string): Promise<ApprovalRequest[]> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("approval_requests")
          .select("*")
          .eq("user_id", effectiveUserId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
        1200
      );

      if (!error && data) {
        data.forEach((r: ApprovalRequest) => store.approvalRequests.set(r.id, r));
        return data;
      }
    } catch {
      // Fall through
    }

    return Array.from(store.approvalRequests.values()).filter(
      (r) => r.user_id === effectiveUserId && r.status === "pending"
    );
  }

  static async createApprovalRequest(request: Omit<ApprovalRequest, "id" | "created_at" | "updated_at">): Promise<ApprovalRequest> {
    const store = getStore();
    const newReq: ApprovalRequest = {
      ...request,
      id: `appr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.approvalRequests.set(newReq.id, newReq);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("approval_requests").insert(newReq),
        1200
      );
    } catch {
      // Retained in memory
    }

    return newReq;
  }

  static async updateApprovalRequestStatus(id: string, status: "approved" | "rejected" | "expired"): Promise<ApprovalRequest | null> {
    const store = getStore();
    const existing = store.approvalRequests.get(id);
    if (!existing) return null;

    const updated: ApprovalRequest = {
      ...existing,
      status,
      updated_at: new Date().toISOString(),
    };

    store.approvalRequests.set(id, updated);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("approval_requests").update({ status, updated_at: updated.updated_at }).eq("id", id),
        1200
      );
    } catch {
      // Fall through
    }

    return updated;
  }

  // ============================================================
  // AUDIT LOGS
  // ============================================================
  static async createAuditLog(log: Omit<AuditLog, "id" | "created_at">): Promise<AuditLog> {
    const store = getStore();
    const newLog: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    store.auditLogs.set(newLog.id, newLog);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("audit_logs").insert(newLog),
        1200
      );
    } catch {
      // Retained in memory
    }

    return newLog;
  }

  // ============================================================
  // DAILY BRIEFINGS
  // ============================================================
  static async getLatestDailyBriefing(userId?: string): Promise<DailyBriefing | null> {
    const store = getStore();
    const effectiveUserId = userId || store.profile.user_id;

    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await withTimeout(
        supabase
          .from("daily_briefings")
          .select("*")
          .eq("user_id", effectiveUserId)
          .order("date", { ascending: false })
          .limit(1)
          .single(),
        1200
      );

      if (!error && data) {
        store.dailyBriefings.set(data.id, data);
        return data;
      }
    } catch {
      // Fall through
    }

    const briefings = Array.from(store.dailyBriefings.values()).filter(
      (b) => b.user_id === effectiveUserId
    );

    return briefings.length > 0 ? briefings[briefings.length - 1] : null;
  }

  static async saveDailyBriefing(briefing: Omit<DailyBriefing, "id" | "created_at">): Promise<DailyBriefing> {
    const store = getStore();
    const newBriefing: DailyBriefing = {
      ...briefing,
      id: `brf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      created_at: new Date().toISOString(),
    };

    store.dailyBriefings.set(newBriefing.id, newBriefing);

    try {
      const supabase = await createServerSupabaseClient();
      await withTimeout(
        supabase.from("daily_briefings").upsert(newBriefing, { onConflict: "user_id,date" }),
        1200
      );
    } catch {
      // Retained in memory
    }

    return newBriefing;
  }
}
