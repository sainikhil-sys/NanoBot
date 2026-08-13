import { Bot } from "@/types/database.types";

export const SYSTEM_BOTS: Bot[] = [
  {
    id: "bot-chatbot-001",
    name: "ChatBot",
    slug: "chatbot",
    description: "Specialized in conversational reasoning, interactive task guidance, and contextual multi-turn dialogue.",
    category: "Conversational",
    status: "active",
    capabilities: [
      "Conversational Reasoning",
      "Contextual Dialogue",
      "Task Guidance",
      "Prompt Refinement"
    ],
    avatar_icon: "ChatCircle",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "bot-codebot-002",
    name: "CodeBot",
    slug: "codebot",
    description: "Specialized in algorithmic synthesis, Abstract Syntax Tree inspection, static security heuristics, and refactoring.",
    category: "Engineering",
    status: "active",
    capabilities: [
      "Syntax Analysis",
      "AST Parsing",
      "Complexity Profiling",
      "Security Linting",
      "Algorithmic Synthesis"
    ],
    avatar_icon: "Code",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "bot-visionbot-003",
    name: "VisionBot",
    slug: "visionbot",
    description: "Specialized in tensor transformation, spatial feature extraction, classification, and visual anomaly detection.",
    category: "Computer Vision",
    status: "active",
    capabilities: [
      "Tensor Transformation",
      "Spatial Feature Extraction",
      "Visual Classification",
      "Bounding & Salience Mapping"
    ],
    avatar_icon: "Eye",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "bot-researchbot-004",
    name: "ResearchBot",
    slug: "researchbot",
    description: "Specialized in technical literature synthesis, hypothesis validation, cross-referencing, and factual citation extraction.",
    category: "Research",
    status: "active",
    capabilities: [
      "Literature Synthesis",
      "Semantic Ranking",
      "Citation Extraction",
      "Fact Verification"
    ],
    avatar_icon: "Books",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "bot-documentbot-005",
    name: "DocumentBot",
    slug: "documentbot",
    description: "Specialized in structured document parsing, multi-section text extraction, OCR alignment, and content summarization.",
    category: "Documents",
    status: "active",
    capabilities: [
      "Document Parsing",
      "Hierarchical Extraction",
      "Summary Generation",
      "Table Serialization"
    ],
    avatar_icon: "FileText",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "bot-databot-006",
    name: "DataBot",
    slug: "databot",
    description: "Specialized in statistical distribution modeling, isolation forest anomaly detection, and matrix correlation analysis.",
    category: "Data Science",
    status: "active",
    capabilities: [
      "Anomaly Detection",
      "Distribution Profiling",
      "Correlation Analysis",
      "Matrix Transformation"
    ],
    avatar_icon: "ChartBar",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "bot-studybot-007",
    name: "StudyBot",
    slug: "studybot",
    description: "Specialized in pedagogical breakdown, step-by-step conceptual deconstruction, and structured learning verification.",
    category: "Education",
    status: "active",
    capabilities: [
      "Pedagogical Deconstruction",
      "Step-by-Step Synthesis",
      "Conceptual Verification",
      "Knowledge Distillation"
    ],
    avatar_icon: "GraduationCap",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export function getBotBySlug(slug: string): Bot | undefined {
  return SYSTEM_BOTS.find((b) => b.slug.toLowerCase() === slug.toLowerCase());
}

export function getBotById(id: string): Bot | undefined {
  return SYSTEM_BOTS.find((b) => b.id === id);
}
