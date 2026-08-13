export interface AgentCapability {
  id: string;
  name: string;
  description: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  slug: string;
  category:
    | "Orchestration"
    | "Research"
    | "Engineering"
    | "Data Science"
    | "Document AI"
    | "Computer Vision"
    | "Writing"
    | "Automation"
    | "Knowledge";
  description: string;
  systemPrompt: string;
  modelPreference: string;
  fallbackModel: string;
  capabilities: string[];
  tools: string[];
  avatarIcon: string;
  isCustom?: boolean;
  createdAt?: string;
}

export const SYSTEM_AGENTS: AgentDefinition[] = [
  {
    id: "nanobot-core",
    name: "NanoBot Core Orchestrator",
    slug: "nanobot-core",
    category: "Orchestration",
    description: "Central intelligence router that decomposes multi-step prompts, selects tools, and synthesizes answers.",
    systemPrompt: `You are NanoBot Core, a high-performance universal AI assistant and multi-agent orchestrator.
Directly answer questions, format code cleanly, synthesize complex technical topics, and orchestrate tools effectively.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Intent Routing", "Multi-Agent Synthesis", "Tool Calling", "Universal Reasoning"],
    tools: ["web_search", "document_parser", "code_execution", "knowledge_search"],
    avatarIcon: "Sparkle",
  },
  {
    id: "research-agent",
    name: "Research Agent",
    slug: "research-agent",
    category: "Research",
    description: "Deep factual research, literature review, multi-source verification, and technical synthesis.",
    systemPrompt: `You are the Research Agent. Your purpose is to provide deep, fact-checked, well-structured research reports with clear citations.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Fact Verification", "Source Attribution", "Technical Literature Synthesis"],
    tools: ["web_search", "knowledge_search", "document_parser"],
    avatarIcon: "MagnifyingGlass",
  },
  {
    id: "coding-agent",
    name: "Coding Agent",
    slug: "coding-agent",
    category: "Engineering",
    description: "Full-stack software engineering, architecture design, algorithm development, and debugging.",
    systemPrompt: `You are the Coding Agent. Provide clean, robust, type-safe, production-ready code with concise technical explanations.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["TypeScript / Python", "System Architecture", "Performance Profiling", "Security Auditing"],
    tools: ["code_execution", "file_search", "document_parser"],
    avatarIcon: "Code",
  },
  {
    id: "data-analyst-agent",
    name: "Data Analyst Agent",
    slug: "data-analyst-agent",
    category: "Data Science",
    description: "Tabular data extraction, statistical profiling, distribution metrics, and trend analysis.",
    systemPrompt: `You are the Data Analyst Agent. Analyze structured data, extract statistical insights, and recommend data transformations.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["CSV / Tabular Parsing", "Statistical Summary", "Anomaly Detection", "SQL Generation"],
    tools: ["calculator", "database_query", "code_execution"],
    avatarIcon: "ChartBar",
  },
  {
    id: "document-agent",
    name: "Document Agent",
    slug: "document-agent",
    category: "Document AI",
    description: "PDF parsing, section chunking, contractual clause extraction, and document synthesis.",
    systemPrompt: `You are the Document Agent. Extract, structure, and answer queries regarding uploaded documents and reports.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["PDF Extraction", "Context Chunking", "Semantic Summarization"],
    tools: ["document_parser", "knowledge_search", "file_search"],
    avatarIcon: "FileText",
  },
  {
    id: "vision-agent",
    name: "Vision Agent",
    slug: "vision-agent",
    category: "Computer Vision",
    description: "Image classification, visual question answering, spatial object detection, and background removal.",
    systemPrompt: `You are the Vision Agent. Interpret visual inputs, explain UI mockups, and analyze image features.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Image Analysis", "OCR Transcription", "Visual Diagnostics"],
    tools: ["document_parser", "code_execution"],
    avatarIcon: "Eye",
  },
  {
    id: "writing-agent",
    name: "Writing Agent",
    slug: "writing-agent",
    category: "Writing",
    description: "Editorial drafting, technical documentation, documentation RFCs, and executive briefs.",
    systemPrompt: `You are the Writing Agent. Draft polished, engaging, clear, and well-structured written content.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Technical Documentation", "Executive Briefings", "Editorial Polishing"],
    tools: ["knowledge_search", "web_search"],
    avatarIcon: "PenNib",
  },
  {
    id: "automation-agent",
    name: "Automation Agent",
    slug: "automation-agent",
    category: "Automation",
    description: "Synthesizes event triggers, webhook schedules, and scheduled repetitive tasks.",
    systemPrompt: `You are the Automation Agent. Assist users in structuring cron-based and event-driven automation rules.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Schedule Synthesis", "Webhook Pipeline", "Execution Validation"],
    tools: ["workflow_execution", "http_request", "email"],
    avatarIcon: "Lightning",
  },
  {
    id: "workflow-agent",
    name: "Workflow Agent",
    slug: "workflow-agent",
    category: "Automation",
    description: "Constructs DAG node execution graphs from high-level natural language descriptions.",
    systemPrompt: `You are the Workflow Agent. Translate high-level user goals into structured workflow DAG topologies.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["DAG Construction", "Node Routing", "Pipeline Optimization"],
    tools: ["workflow_execution", "database_query"],
    avatarIcon: "TreeStructure",
  },
  {
    id: "web-research-agent",
    name: "Web Research Agent",
    slug: "web-research-agent",
    category: "Research",
    description: "Real-time web queries, news aggregation, and live external API lookup.",
    systemPrompt: `You are the Web Research Agent. Search the live web, synthesize recent findings, and provide exact links and source references.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Live Web Crawl", "Real-Time News", "Multi-Source Verification"],
    tools: ["web_search", "http_request"],
    avatarIcon: "Globe",
  },
  {
    id: "developer-agent",
    name: "Developer Agent",
    slug: "developer-agent",
    category: "Engineering",
    description: "API schema generation, database query design, CI/CD script authoring, and cloud deployments.",
    systemPrompt: `You are the Developer Agent. Assist developers with DevOps, API integration, and database queries.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["REST / GraphQL", "SQL & Migrations", "Docker & Cloud Setup"],
    tools: ["database_query", "http_request", "code_execution"],
    avatarIcon: "Cpu",
  },
  {
    id: "knowledge-agent",
    name: "Knowledge Agent",
    slug: "knowledge-agent",
    category: "Knowledge",
    description: "High-dimensional vector indexing, similarity search, and semantic RAG retrieval.",
    systemPrompt: `You are the Knowledge Agent. Manage document vectors, semantic chunking, and embedding similarity ranking.`,
    modelPreference: "llama-3.3-70b-versatile",
    fallbackModel: "meta-llama/llama-3.3-70b-instruct",
    capabilities: ["Vector Embedding", "Cosine Similarity", "Dense Retrieval"],
    tools: ["embedding", "knowledge_search", "document_parser"],
    avatarIcon: "Books",
  },
];

export function getAgentById(idOrSlug: string): AgentDefinition {
  const found = SYSTEM_AGENTS.find(
    (a) => a.id === idOrSlug || a.slug === idOrSlug
  );
  return found || SYSTEM_AGENTS[0];
}
