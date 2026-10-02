import { WorkflowDefinition } from "./types";

/**
 * Starter workflow templates. These are real, runnable definitions used to seed
 * an empty store so the builder and executions views are not blank on first use.
 * They contain no fabricated execution history — runs only appear once executed.
 */
export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf-doc-research",
    name: "Document Research & Summarization",
    description: "Parses a document into chunks, embeds them, and synthesizes an executive summary.",
    nodes: [
      {
        id: "n-1",
        type: "trigger_manual",
        title: "Manual Trigger",
        description: "Starts the workflow with a document payload",
        icon: "Play",
        config: {},
        position: { x: 60, y: 160 },
      },
      {
        id: "n-2",
        type: "document_parser",
        title: "Document Parser",
        description: "Splits the input text into overlapping chunks",
        icon: "FileText",
        config: { text: "{{trigger.text}}", chunkSize: 800, overlap: 80 },
        position: { x: 300, y: 160 },
      },
      {
        id: "n-3",
        type: "embedding_generator",
        title: "Vector Embedding",
        description: "Generates a dense embedding of the content",
        icon: "Pulse",
        config: { text: "{{trigger.text}}" },
        position: { x: 540, y: 160 },
      },
      {
        id: "n-4",
        type: "llm_completion",
        title: "Summary Synthesis",
        description: "Writes an executive summary",
        icon: "Sparkle",
        config: { prompt: "Summarize the key findings and risks in this text:\n\n{{trigger.text}}" },
        position: { x: 780, y: 160 },
      },
      {
        id: "n-5",
        type: "output",
        title: "Result",
        description: "Stores the final summary payload",
        icon: "CheckCircle",
        config: {},
        position: { x: 1020, y: 160 },
      },
    ],
    edges: [
      { id: "e-1-2", source: "n-1", target: "n-2" },
      { id: "e-2-3", source: "n-2", target: "n-3" },
      { id: "e-3-4", source: "n-3", target: "n-4" },
      { id: "e-4-5", source: "n-4", target: "n-5" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wf-web-brief",
    name: "AI Intelligence Brief",
    description: "Searches the web for recent AI developments and drafts a short briefing.",
    nodes: [
      {
        id: "m-1",
        type: "trigger_schedule",
        title: "Schedule Trigger",
        description: "Runs on a configured cron schedule",
        icon: "Clock",
        config: { cron: "0 9 * * 1-5" },
        position: { x: 60, y: 160 },
      },
      {
        id: "m-2",
        type: "web_search",
        title: "Web Search",
        description: "Retrieves recent AI news and papers",
        icon: "Globe",
        config: { query: "latest AI and deep learning breakthroughs" },
        position: { x: 300, y: 160 },
      },
      {
        id: "m-3",
        type: "llm_completion",
        title: "Briefing Writer",
        description: "Creates a 3-bullet executive summary",
        icon: "Sparkle",
        config: {
          prompt: "Write a 3-bullet executive summary from these search results:\n\n{{nodes.m-2.output.results}}",
        },
        position: { x: 540, y: 160 },
      },
      {
        id: "m-4",
        type: "output",
        title: "Result",
        description: "Stores the briefing",
        icon: "CheckCircle",
        config: {},
        position: { x: 780, y: 160 },
      },
    ],
    edges: [
      { id: "e-m-1-2", source: "m-1", target: "m-2" },
      { id: "e-m-2-3", source: "m-2", target: "m-3" },
      { id: "e-m-3-4", source: "m-3", target: "m-4" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
