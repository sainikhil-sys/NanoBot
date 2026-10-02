import { BOT_REGISTRY, BotDefinition } from "./bot-registry";

export interface RoutingDecision {
  botId: string;
  botName: string;
  category: string;
  confidence: number;
  tools: string[];
  reason: string;
  taskType: string;
  requiresWebSearch: boolean;
  requiresEmbedding: boolean;
  requiresDocumentParsing: boolean;
}

// Common conversational greetings and social cues
const CONVERSATIONAL_PATTERNS = [
  /^hi+$/i,
  /^hello+$/i,
  /^hey+$/i,
  /^heyy+$/i,
  /^yo+$/i,
  /^sup$/i,
  /^howdy$/i,
  /^greetings$/i,
  /^good\s+(morning|afternoon|evening|day|night)$/i,
  /^how\s+(are\s+you|are\s+u|r\s+u|are\s+things|is\s+it\s+going|do\s+you\s+do)/i,
  /^what('?s|\s+is)\s+up/i,
  /^thanks?/i,
  /^thank\s+you/i,
  /^thx/i,
  /^appreciate\s+it/i,
  /^bye/i,
  /^goodbye/i,
  /^see\s+(you|ya|u)/i,
  /^cya/i,
  /^who\s+are\s+you/i,
  /^what\s+is\s+nanobot/i,
  /^what\s+can\s+you\s+do/i,
  /^help(\s+me)?$/i,
  /^can\s+you\s+help(\s+me)?/i,
];

export class TaskRouter {
  /**
   * Deterministically and semantically classifies user intent into optimal bot & tool execution pipeline.
   */
  static route(prompt: string, explicitBotId?: string): RoutingDecision {
    // 1. If user explicitly selected a specialized bot (other than auto), honor the manual override
    if (explicitBotId && explicitBotId !== "auto" && BOT_REGISTRY[explicitBotId]) {
      const bot = BOT_REGISTRY[explicitBotId];
      return {
        botId: bot.id,
        botName: bot.name,
        category: bot.category,
        confidence: 1.0,
        tools: bot.tools,
        reason: `User explicitly selected ${bot.name}`,
        taskType: explicitBotId,
        requiresWebSearch: bot.id === "web-research",
        requiresEmbedding: bot.id === "embedding",
        requiresDocumentParsing: bot.id === "document-analysis",
      };
    }

    const raw = prompt.trim();
    const p = raw.toLowerCase();

    // 2. Fast Casual Greetings & Social Dialogue Detection (NEVER trigger web search or tools)
    const isGreeting = CONVERSATIONAL_PATTERNS.some((pattern) => pattern.test(p));
    if (isGreeting || p === "hi" || p === "hii" || p === "hello" || p === "hey") {
      const bot = BOT_REGISTRY["general-chat"];
      return {
        botId: bot.id,
        botName: "NanoBot",
        category: bot.category,
        confidence: 0.99,
        tools: [],
        reason: "Detected casual greeting or conversational dialog",
        taskType: "general_conversation",
        requiresWebSearch: false,
        requiresEmbedding: false,
        requiresDocumentParsing: false,
      };
    }

    // 2.5 Personal Executive Assistant Intent Detection (Emails, Calendar, Tasks, Memory, Briefings, LinkedIn, Drive)
    const isPersonalIntent =
      p.includes("email") ||
      p.includes("inbox") ||
      p.includes("draft a reply") ||
      p.includes("reply to") ||
      p.includes("meeting") ||
      p.includes("calendar") ||
      p.includes("schedule") ||
      p.includes("free slot") ||
      p.includes("focus on today") ||
      p.includes("daily briefing") ||
      p.includes("morning briefing") ||
      p.includes("overview of my day") ||
      p.includes("remind me to") ||
      p.includes("create a task") ||
      p.includes("create task") ||
      p.includes("tasks from") ||
      p.includes("remember that") ||
      p.includes("linkedin post") ||
      p.includes("in my drive");

    if (isPersonalIntent) {
      const bot = BOT_REGISTRY["personal-assistant"] || BOT_REGISTRY["auto"];
      return {
        botId: "personal-assistant",
        botName: "Personal Assistant",
        category: "Executive",
        confidence: 0.98,
        tools: [
          "gmail_search",
          "calendar_availability",
          "tasks_create",
          "memory_store",
          "briefing_generate",
          "linkedin_prepare_post",
        ],
        reason: "Detected personal productivity, communication, scheduling, or memory request",
        taskType: "personal_assistant",
        requiresWebSearch: false,
        requiresEmbedding: false,
        requiresDocumentParsing: false,
      };
    }

    // 3. High-Dimensional Vector & Embedding Synthesis Detection
    if (
      p.includes("convert this") && (p.includes("vector") || p.includes("embedding")) ||
      p.includes("into embeddings") ||
      p.includes("to vector") ||
      p.includes("generate embeddings") ||
      p.includes("word to vector") ||
      p.includes("cosine similarity") ||
      p.includes("dimension reduction") ||
      p.includes("pgvector")
    ) {
      const bot = BOT_REGISTRY["embedding"];
      return {
        botId: bot.id,
        botName: "Embedding Engine",
        category: bot.category,
        confidence: 0.98,
        tools: bot.tools,
        reason: "Detected high-dimensional vector synthesis and semantic embedding request",
        taskType: "vector_embedding",
        requiresWebSearch: false,
        requiresEmbedding: true,
        requiresDocumentParsing: false,
      };
    }

    // 4. Image Background Removal & Computer Vision Detection
    if (
      p.includes("remove background") ||
      p.includes("remove bg") ||
      p.includes("transparent background") ||
      p.includes("segment image") ||
      p.includes("crop background") ||
      p.includes("alpha mask")
    ) {
      const bot = BOT_REGISTRY["image-processing"];
      return {
        botId: bot.id,
        botName: "Image Processing Bot",
        category: bot.category,
        confidence: 0.97,
        tools: bot.tools,
        reason: "Detected computer vision image foreground segmentation request",
        taskType: "image_processing",
        requiresWebSearch: false,
        requiresEmbedding: false,
        requiresDocumentParsing: false,
      };
    }

    // 5. Document & PDF Parsing Detection
    if (
      (p.includes("pdf") || p.includes("docx") || p.includes("document") || p.includes("file")) &&
      (p.includes("summarize") || p.includes("extract") || p.includes("parse") || p.includes("analyze") || p.includes("read"))
    ) {
      const bot = BOT_REGISTRY["document-analysis"];
      return {
        botId: bot.id,
        botName: "Document Analysis Bot",
        category: bot.category,
        confidence: 0.95,
        tools: bot.tools,
        reason: "Detected structured document ingestion and semantic text parsing request",
        taskType: "document_analysis",
        requiresWebSearch: false,
        requiresEmbedding: false,
        requiresDocumentParsing: true,
      };
    }

    // 6. Coding & Algorithmic Synthesis Detection
    if (
      p.includes("write a python") ||
      p.includes("write a javascript") ||
      p.includes("write a typescript") ||
      p.includes("write code") ||
      p.includes("write a function") ||
      p.includes("react component") ||
      p.includes("debug this") ||
      p.includes("sql query") ||
      p.includes("algorithm") ||
      p.includes("reverse a string") ||
      p.includes("read a csv") ||
      p.includes("read csv") ||
      p.startsWith("const ") ||
      p.startsWith("def ") ||
      p.startsWith("class ") ||
      p.startsWith("function ") ||
      p.includes("implementation in")
    ) {
      const bot = BOT_REGISTRY["coding"];
      return {
        botId: bot.id,
        botName: "Coding Assistant",
        category: bot.category,
        confidence: 0.96,
        tools: bot.tools,
        reason: "Detected algorithmic synthesis, software architecture, or code debugging task",
        taskType: "coding",
        requiresWebSearch: false,
        requiresEmbedding: false,
        requiresDocumentParsing: false,
      };
    }

    // 7. Web Research & Current News Detection (Explicit Search or Real-Time Needs)
    const isExplicitSearch =
      p.startsWith("search ") ||
      p.startsWith("search for ") ||
      p.includes("search the web") ||
      p.includes("search web") ||
      p.includes("latest news") ||
      p.includes("today's news") ||
      p.includes("news today") ||
      p.includes("current price") ||
      p.includes("stock price") ||
      p.includes("what happened in") ||
      p.includes("what happened today") ||
      p.includes("latest developments") ||
      (p.includes("latest") && (p.includes("news") || p.includes("ai") || p.includes("release") || p.includes("update") || p.includes("version")));

    if (isExplicitSearch) {
      const bot = BOT_REGISTRY["web-research"];
      return {
        botId: bot.id,
        botName: "Web Research Bot",
        category: bot.category,
        confidence: 0.95,
        tools: bot.tools,
        reason: "Detected real-time factual research and live web search requirement",
        taskType: "web_research",
        requiresWebSearch: true,
        requiresEmbedding: false,
        requiresDocumentParsing: false,
      };
    }

    // 8. General Knowledge & Universal Reasoning (Default)
    const bot = BOT_REGISTRY["general-chat"];
    return {
      botId: bot.id,
      botName: "NanoBot",
      category: bot.category,
      confidence: 0.90,
      tools: bot.tools,
      reason: "Universal conversational reasoning & synthesis",
      taskType: "knowledge",
      requiresWebSearch: false,
      requiresEmbedding: false,
      requiresDocumentParsing: false,
    };
  }
}
