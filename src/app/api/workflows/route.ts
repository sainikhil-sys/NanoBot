import { NextRequest, NextResponse } from "next/server";
import { WorkflowDefinition } from "@/lib/workflows/types";

// In-memory predefined workflows
const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "wf-doc-research",
    name: "Automated Document Research & Summarization",
    description: "Ingests uploaded documents, chunks paragraphs, embeds vectors, and generates executive summaries.",
    nodes: [
      {
        id: "n-1",
        type: "trigger_file",
        title: "File Upload Trigger",
        description: "Monitors new document uploads (PDF/DOCX)",
        icon: "UploadSimple",
        config: { allowedExtensions: [".pdf", ".docx", ".txt"] },
        position: { x: 50, y: 150 },
      },
      {
        id: "n-2",
        type: "document_parser",
        title: "Document Parser",
        description: "Extracts sections and text chunks",
        icon: "FileText",
        config: { chunkSize: 500, overlap: 50 },
        position: { x: 280, y: 150 },
      },
      {
        id: "n-3",
        type: "embedding_generator",
        title: "Vector Embedding",
        description: "Generates 1536d dense embeddings",
        icon: "Pulse",
        config: { model: "text-embedding-3-small" },
        position: { x: 510, y: 150 },
      },
      {
        id: "n-4",
        type: "agent_ai",
        title: "Research Agent Synthesis",
        description: "Synthesizes key findings & risks",
        icon: "Robot",
        config: { agentId: "research-agent", prompt: "Summarize main findings and contractual risks" },
        position: { x: 740, y: 150 },
      },
      {
        id: "n-5",
        type: "email_notification",
        title: "Email Dispatcher",
        description: "Sends report to project lead",
        icon: "Envelope",
        config: { to: "lead@nanobot.ai", subject: "Automated Analysis Report" },
        position: { x: 970, y: 150 },
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
    id: "wf-web-monitor",
    name: "Daily AI Intelligence & News Brief",
    description: "Scheduled web research, multi-source verification, and markdown report generation.",
    nodes: [
      {
        id: "m-1",
        type: "trigger_schedule",
        title: "Daily 9:00 AM Cron",
        description: "Runs automatically every weekday",
        icon: "Clock",
        config: { cron: "0 9 * * 1-5" },
        position: { x: 50, y: 150 },
      },
      {
        id: "m-2",
        type: "web_search",
        title: "Live Web Crawler",
        description: "Retrieves top AI news & papers",
        icon: "Globe",
        config: { query: "Latest AI and deep learning breakthroughs today" },
        position: { x: 280, y: 150 },
      },
      {
        id: "m-3",
        type: "agent_ai",
        title: "Writing Agent Brief",
        description: "Creates executive morning briefing",
        icon: "Sparkle",
        config: { prompt: "Create a 3-bullet executive summary of latest AI breakthroughs" },
        position: { x: 510, y: 150 },
      },
      {
        id: "m-4",
        type: "output",
        title: "Workspace Feed Output",
        description: "Posts to Activity feed",
        icon: "CheckCircle",
        config: { destination: "activity_feed" },
        position: { x: 740, y: 150 },
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

declare global {
  // eslint-disable-next-line no-var
  var __nanobotWorkflowsList: WorkflowDefinition[] | undefined;
}

if (!globalThis.__nanobotWorkflowsList) {
  globalThis.__nanobotWorkflowsList = DEFAULT_WORKFLOWS;
}

export async function GET() {
  return NextResponse.json({
    workflows: globalThis.__nanobotWorkflowsList || DEFAULT_WORKFLOWS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newWorkflow: WorkflowDefinition = {
      id: body.id || `wf-${Date.now()}`,
      name: body.name || "Custom Workflow",
      description: body.description || "",
      nodes: body.nodes || [],
      edges: body.edges || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!globalThis.__nanobotWorkflowsList) {
      globalThis.__nanobotWorkflowsList = [];
    }
    globalThis.__nanobotWorkflowsList.unshift(newWorkflow);

    return NextResponse.json({ workflow: newWorkflow });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid workflow data" }, { status: 400 });
  }
}
