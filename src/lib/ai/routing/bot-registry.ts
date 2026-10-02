export interface BotDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: string;
  iconName: string;
  capabilities: string[];
  tools: string[];
  model: string;
  architecture: string;
  contextWindow: string;
  supportedTasks: string[];
}

export const BOT_REGISTRY: Record<string, BotDefinition> = {
  "auto": {
    id: "auto",
    name: "NanoBot Auto-Router",
    shortName: "Auto",
    description: "Automatically classifies intent and orchestrates specialized neural models",
    category: "Orchestration",
    iconName: "Sparkle",
    capabilities: ["intent_classification", "multi_bot_routing", "tool_selection", "pipeline_orchestration"],
    tools: ["web_search", "document_parser", "vector_embedder", "code_analyzer"],
    model: "llama-3.3-70b-versatile",
    architecture: "Transformer (Decoder-Only)",
    contextWindow: "128k tokens",
    supportedTasks: ["any"],
  },
  "web-research": {
    id: "web-research",
    name: "Web Research Bot",
    shortName: "Web Research",
    description: "Real-time internet intelligence, factual citation extraction, and source ranking",
    category: "Research",
    iconName: "Globe",
    capabilities: ["web_search", "current_information", "citation_extraction", "domain_ranking"],
    tools: ["web_search", "source_crawler", "semantic_reranker"],
    model: "llama-3.3-70b-versatile",
    architecture: "Transformer (Decoder-Only)",
    contextWindow: "128k tokens",
    supportedTasks: ["news", "web_search", "current_events", "comparisons", "documentation"],
  },
  "coding": {
    id: "coding",
    name: "Coding Bot",
    shortName: "Coding",
    description: "Algorithmic synthesis, AST inspection, debugging, and software engineering",
    category: "Engineering",
    iconName: "Code",
    capabilities: ["code_generation", "ast_parsing", "security_linting", "refactoring"],
    tools: ["ast_parser", "linter", "code_executor"],
    model: "meta-llama/llama-3.3-70b-instruct:free",
    architecture: "Transformer (Decoder-Only)",
    contextWindow: "128k tokens",
    supportedTasks: ["code", "programming", "react", "python", "typescript", "debugging", "sql"],
  },
  "document-analysis": {
    id: "document-analysis",
    name: "Document Bot",
    shortName: "Documents",
    description: "Hierarchical text extraction, OCR alignment, and multi-page summarization",
    category: "Documents",
    iconName: "FileText",
    capabilities: ["document_parsing", "pdf_extraction", "semantic_chunking", "summarization"],
    tools: ["pdf_parser", "docx_parser", "semantic_chunker"],
    model: "llama-3.3-70b-versatile",
    architecture: "Transformer Encoder-Decoder",
    contextWindow: "64k tokens",
    supportedTasks: ["pdf", "docx", "document", "summarize", "extract_text"],
  },
  "embedding": {
    id: "embedding",
    name: "Vector Bot",
    shortName: "Vector",
    description: "Dense high-dimensional vector representations and pgvector similarity indexing",
    category: "Embeddings",
    iconName: "Pulse",
    capabilities: ["vector_embedding", "pgvector_storage", "pca_reduction", "cosine_similarity"],
    tools: ["text_embedding_3", "pgvector_hnsw", "pca_projector"],
    model: "openai/text-embedding-3-small",
    architecture: "Transformer Encoder",
    contextWindow: "8k tokens",
    supportedTasks: ["embedding", "vector", "word_to_vector", "similarity", "cosine"],
  },
  "image-processing": {
    id: "image-processing",
    name: "Image Processing Bot",
    shortName: "Image",
    description: "Computer vision edge segmentation, alpha masking, and spatial feature mapping",
    category: "Computer Vision",
    iconName: "Scissors",
    capabilities: ["background_removal", "alpha_segmentation", "chromakey_isolation", "spatial_mapping"],
    tools: ["canvas_segmentation", "chroma_filter"],
    model: "NanoBot-Vision-Segmenter",
    architecture: "Convolutional / Spatial Vision Neural Network",
    contextWindow: "Visual Tensor",
    supportedTasks: ["remove_bg", "image", "photo", "segmentation", "transparent"],
  },
  "personal-assistant": {
    id: "personal-assistant",
    name: "Personal Assistant Bot",
    shortName: "Personal",
    description: "Autonomous natural language executive assistant for Gmail, Calendar, Tasks, Memory, and Briefings",
    category: "Executive",
    iconName: "UserGear",
    capabilities: ["email_classification", "calendar_scheduling", "task_extraction", "memory_grounding", "briefing_synthesis"],
    tools: ["gmail_search", "calendar_availability", "tasks_create", "memory_store", "briefing_generate", "linkedin_prepare_post"],
    model: "llama-3.3-70b-versatile",
    architecture: "Transformer (Decoder-Only)",
    contextWindow: "128k tokens",
    supportedTasks: ["email", "calendar", "meetings", "tasks", "briefing", "memory", "linkedin", "drive"],
  },
  "general-chat": {
    id: "general-chat",
    name: "General Chat Bot",
    shortName: "General",
    description: "Conversational reasoning, multi-turn context, and conceptual explanations",
    category: "Dialogue",
    iconName: "ChatCircle",
    capabilities: ["multi_turn_dialogue", "conceptual_breakdown", "task_planning", "reasoning"],
    tools: ["knowledge_retriever"],
    model: "llama-3.3-70b-versatile",
    architecture: "Transformer (Decoder-Only)",
    contextWindow: "128k tokens",
    supportedTasks: ["chat", "explain", "general", "help"],
  },
};

export function getBotDefinition(id: string): BotDefinition {
  return BOT_REGISTRY[id] || BOT_REGISTRY["general-chat"];
}

export function listAvailableBots(): BotDefinition[] {
  return Object.values(BOT_REGISTRY);
}
