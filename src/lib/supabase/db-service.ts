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

  // Self-heal any properties if missing from previous hot-reload states
  if (!globalThis.__nanobotStore.tasks) globalThis.__nanobotStore.tasks = new Map();
  if (!globalThis.__nanobotStore.steps) globalThis.__nanobotStore.steps = new Map();
  if (!globalThis.__nanobotStore.events) globalThis.__nanobotStore.events = new Map();
  if (!globalThis.__nanobotStore.conversations) globalThis.__nanobotStore.conversations = new Map();
  if (!globalThis.__nanobotStore.messages) globalThis.__nanobotStore.messages = new Map();
  if (!globalThis.__nanobotStore.files) globalThis.__nanobotStore.files = new Map();
  if (!globalThis.__nanobotStore.notifications) globalThis.__nanobotStore.notifications = new Map();
  if (!globalThis.__nanobotStore.savedItems) globalThis.__nanobotStore.savedItems = new Map();
  if (!globalThis.__nanobotStore.vectors) globalThis.__nanobotStore.vectors = new Map();

  return globalThis.__nanobotStore;
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
}
