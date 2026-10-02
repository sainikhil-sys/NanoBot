import { PersonalMemory, MemoryCategory } from "@/types/database.types";
import { DbService } from "@/lib/supabase/db-service";

export class MemoryService {
  /**
   * List all stored memories for the user.
   */
  static async listMemories(userId?: string): Promise<PersonalMemory[]> {
    return DbService.listPersonalMemory(userId);
  }

  /**
   * Store a memory explicitly or when detected from user statement.
   */
  static async storeMemory(params: {
    category: MemoryCategory;
    key: string;
    value: string;
    confidence?: number;
    isPinned?: boolean;
    userId?: string;
  }): Promise<PersonalMemory> {
    const memory = await DbService.createPersonalMemory({
      user_id: params.userId || "usr-prod-001",
      category: params.category,
      key: params.key,
      value: params.value,
      confidence: params.confidence ?? 1.0,
      is_pinned: params.isPinned ?? false,
      is_disabled: false,
      metadata: { storedAt: new Date().toISOString() },
    });

    await DbService.createAuditLog({
      user_id: params.userId || "usr-prod-001",
      action: "store_memory",
      tool: "memory.store",
      target: params.key,
      permission_level: "PREPARE",
      approval_status: "auto",
      result_status: "success",
      metadata: { category: params.category, key: params.key },
    });

    return memory;
  }

  /**
   * Searches memories relevant to a given query or context.
   */
  static async searchMemories(query: string, userId?: string): Promise<PersonalMemory[]> {
    const memories = await DbService.listPersonalMemory(userId);
    const q = query.toLowerCase();

    return memories.filter(
      (m) =>
        m.key.toLowerCase().includes(q) ||
        m.value.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }

  /**
   * Generates a concise system prompt memory grounding string for the AI orchestrator.
   */
  static async getGroundingContext(userId?: string): Promise<string> {
    const memories = await DbService.listPersonalMemory(userId);
    if (memories.length === 0) return "";

    const lines = memories.map((m) => `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}`);
    return `\n## PERSONAL USER CONTEXT & MEMORY:\n${lines.join("\n")}\n`;
  }

  /**
   * Deletes a specific memory item.
   */
  static async deleteMemory(id: string): Promise<boolean> {
    return DbService.deletePersonalMemory(id);
  }

  /**
   * Clears all stored memories for the user.
   */
  static async clearAll(userId?: string): Promise<boolean> {
    return DbService.clearPersonalMemory(userId);
  }
}
