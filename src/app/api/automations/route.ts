import { NextRequest, NextResponse } from "next/server";

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  workflowId: string;
  workflowName: string;
  triggerType: "schedule" | "file_upload" | "webhook" | "event";
  triggerConfig: string;
  status: "active" | "paused";
  createdAt: string;
  lastRun?: string;
  nextRun?: string;
  executionCount: number;
}

const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  {
    id: "auto-daily-news",
    name: "Morning AI News & Research Crawler",
    description: "Crawls AI research papers and synthesizes morning briefs at 9:00 AM daily.",
    workflowId: "wf-web-monitor",
    workflowName: "Daily AI Intelligence & News Brief",
    triggerType: "schedule",
    triggerConfig: "0 9 * * 1-5 (Weekdays at 9:00 AM)",
    status: "active",
    createdAt: new Date().toISOString(),
    lastRun: "Today at 9:00 AM",
    nextRun: "Tomorrow at 9:00 AM",
    executionCount: 24,
  },
  {
    id: "auto-pdf-ingest",
    name: "Automated PDF Ingestion & Vector Indexing",
    description: "Watches files directory and triggers document parser and vector embeddings upon upload.",
    workflowId: "wf-doc-research",
    workflowName: "Automated Document Research & Summarization",
    triggerType: "file_upload",
    triggerConfig: "*.pdf, *.docx, *.txt uploads",
    status: "active",
    createdAt: new Date().toISOString(),
    lastRun: "2 hours ago",
    nextRun: "On next file upload",
    executionCount: 18,
  },
  {
    id: "auto-github-webhook",
    name: "Pull Request Code Quality & Security Audit",
    description: "Listens for inbound webhooks and triggers static complexity and vulnerability heuristics.",
    workflowId: "wf-doc-research",
    workflowName: "Code Security & Complexity Analysis",
    triggerType: "webhook",
    triggerConfig: "POST /api/webhooks/github-pr",
    status: "paused",
    createdAt: new Date().toISOString(),
    lastRun: "Yesterday at 4:30 PM",
    nextRun: "Waiting for webhook event",
    executionCount: 7,
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __nanobotAutomationsList: AutomationRule[] | undefined;
}

if (!globalThis.__nanobotAutomationsList) {
  globalThis.__nanobotAutomationsList = DEFAULT_AUTOMATIONS;
}

export async function GET() {
  return NextResponse.json({
    automations: globalThis.__nanobotAutomationsList || DEFAULT_AUTOMATIONS,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newAutomation: AutomationRule = {
      id: body.id || `auto-${Date.now()}`,
      name: body.name || "Custom Automation",
      description: body.description || "",
      workflowId: body.workflowId || "wf-web-monitor",
      workflowName: body.workflowName || "Daily AI Intelligence & News Brief",
      triggerType: body.triggerType || "schedule",
      triggerConfig: body.triggerConfig || "Manual trigger",
      status: "active",
      createdAt: new Date().toISOString(),
      lastRun: "Never",
      nextRun: "Pending trigger",
      executionCount: 0,
    };

    if (!globalThis.__nanobotAutomationsList) {
      globalThis.__nanobotAutomationsList = [];
    }
    globalThis.__nanobotAutomationsList.unshift(newAutomation);

    return NextResponse.json({ automation: newAutomation });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid automation configuration" }, { status: 400 });
  }
}
