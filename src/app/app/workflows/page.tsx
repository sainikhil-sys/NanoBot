"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowExecutionRecord,
} from "@/lib/workflows/types";
import {
  Play,
  Plus,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  Sparkle,
  Globe,
  UploadSimple,
  Pulse,
  FileText,
  Envelope,
  Code,
  ArrowRight,
  Broadcast,
  TreeStructure,
} from "@phosphor-icons/react";

const NODE_PALETTE: Array<{
  type: WorkflowNodeType;
  title: string;
  category: "Triggers" | "AI & Agents" | "Tools & Data" | "Outputs";
  description: string;
  icon: React.ComponentType<{ className?: string; weight?: "bold" | "regular" | "fill" }>;
}> = [
  { type: "trigger_manual", title: "Manual Trigger", category: "Triggers", description: "Trigger on button click", icon: Play },
  { type: "trigger_schedule", title: "Schedule / Cron", category: "Triggers", description: "Periodic automated schedule", icon: Clock },
  { type: "trigger_file", title: "File Upload Trigger", category: "Triggers", description: "Runs when file is uploaded", icon: UploadSimple },
  { type: "trigger_webhook", title: "Webhook Receiver", category: "Triggers", description: "Inbound HTTP webhook", icon: Broadcast },
  { type: "agent_ai", title: "Specialized AI Agent", category: "AI & Agents", description: "Autonomous AI reasoning step", icon: Sparkle },
  { type: "llm_completion", title: "LLM Prompt Completion", category: "AI & Agents", description: "Direct model invocation", icon: Code },
  { type: "web_search", title: "Live Web Crawler", category: "Tools & Data", description: "Live multi-source web search", icon: Globe },
  { type: "document_parser", title: "Document & PDF Parser", category: "Tools & Data", description: "Extracts sections & chunks", icon: FileText },
  { type: "embedding_generator", title: "Vector Embedding", category: "Tools & Data", description: "Computes 1536d dense vectors", icon: Pulse },
  { type: "code_executor", title: "Code Sandbox", category: "Tools & Data", description: "Python/JS isolated execution", icon: Code },
  { type: "email_notification", title: "Email Dispatcher", category: "Outputs", description: "Sends summary email", icon: Envelope },
  { type: "output", title: "Workflow Terminal Output", category: "Outputs", description: "Stores final payload result", icon: CheckCircle },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastExecution, setLastExecution] = useState<WorkflowExecutionRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"canvas" | "timeline">("canvas");

  useEffect(() => {
    async function loadWorkflows() {
      try {
        const res = await fetch("/api/workflows");
        if (res.ok) {
          const data = await res.json();
          setWorkflows(data.workflows || []);
          if (data.workflows?.length > 0) {
            setSelectedWorkflow(data.workflows[0]);
            setSelectedNodeId(data.workflows[0].nodes[0]?.id || null);
          }
        }
      } catch (err) {
        console.error("Failed to load workflows:", err);
      }
    }
    loadWorkflows();
  }, []);

  const handleRunWorkflow = async () => {
    if (!selectedWorkflow || isExecuting) return;
    setIsExecuting(true);
    setActiveTab("timeline");

    // Set all nodes to running visually
    setSelectedWorkflow((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: prev.nodes.map((n) => ({ ...n, status: "running" })),
      };
    });

    try {
      const res = await fetch("/api/workflows/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: selectedWorkflow,
          payload: { query: "Quantum neural computing advancements" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const exec: WorkflowExecutionRecord = data.execution;
        setLastExecution(exec);

        // Update node statuses from actual execution record
        setSelectedWorkflow((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            nodes: prev.nodes.map((node) => {
              const nodeExec = exec.nodeExecutions.find((ne) => ne.nodeId === node.id);
              return {
                ...node,
                status: nodeExec?.status || "success",
                durationMs: nodeExec?.durationMs,
                output: nodeExec?.output,
                error: nodeExec?.error,
              };
            }),
          };
        });
      }
    } catch (err) {
      console.error("Workflow run error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleAddNode = (paletteItem: typeof NODE_PALETTE[0]) => {
    if (!selectedWorkflow) return;
    const newNodeId = `node-${Date.now()}`;
    const prevNode = selectedWorkflow.nodes[selectedWorkflow.nodes.length - 1];

    const newNode: WorkflowNode = {
      id: newNodeId,
      type: paletteItem.type,
      title: paletteItem.title,
      description: paletteItem.description,
      icon: paletteItem.type,
      config: {},
      position: {
        x: (prevNode ? prevNode.position.x + 240 : 50),
        y: 150,
      },
      status: "idle",
    };

    const updatedNodes = [...selectedWorkflow.nodes, newNode];
    const updatedEdges = prevNode
      ? [...selectedWorkflow.edges, { id: `e-${prevNode.id}-${newNodeId}`, source: prevNode.id, target: newNodeId }]
      : selectedWorkflow.edges;

    const updatedWorkflow: WorkflowDefinition = {
      ...selectedWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges,
      updatedAt: new Date().toISOString(),
    };

    setSelectedWorkflow(updatedWorkflow);
    setSelectedNodeId(newNodeId);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return;
    const updatedNodes = selectedWorkflow.nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = selectedWorkflow.edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(updatedNodes[0]?.id || null);
    }
  };

  const selectedNode = selectedWorkflow?.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Visual Workflow Builder"
        description="Construct, inspect, and execute multi-agent DAG pipelines"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunWorkflow}
              disabled={isExecuting || !selectedWorkflow}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play weight="fill" className="h-3 w-3 text-[#16A34A]" />
                  <span>Run Pipeline</span>
                </>
              )}
            </button>
          </div>
        }
      />

      <main className="flex-1 flex flex-col p-4 sm:p-6 max-w-7xl mx-auto w-full gap-4">
        {/* Top Control Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <TreeStructure weight="bold" className="h-5 w-5 text-[#16A34A]" />
            <select
              value={selectedWorkflow?.id || ""}
              onChange={(e) => {
                const wf = workflows.find((w) => w.id === e.target.value);
                if (wf) {
                  setSelectedWorkflow(wf);
                  setSelectedNodeId(wf.nodes[0]?.id || null);
                }
              }}
              className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs font-semibold text-black focus:outline-none"
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] font-mono text-[#6B7280]">
              {selectedWorkflow?.nodes.length || 0} nodes · {selectedWorkflow?.edges.length || 0} transitions
            </span>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setActiveTab("canvas")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "canvas"
                  ? "bg-black text-white"
                  : "text-[#6B7280] hover:text-black"
              }`}
            >
              Interactive Canvas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "timeline"
                  ? "bg-black text-white"
                  : "text-[#6B7280] hover:text-black"
              }`}
            >
              Execution Telemetry
            </button>
          </div>
        </div>

        {activeTab === "canvas" ? (
          /* Main 3-Column Studio Grid: Left Library | Center Canvas | Right Inspector */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[560px]">
            {/* 1. Left Node Palette Library (3 cols) */}
            <div className="lg:col-span-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 flex flex-col space-y-4 overflow-y-auto max-h-[640px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                  Node Palette
                </span>
                <span className="text-[10px] font-mono text-[#6B7280]">Click to append</span>
              </div>

              <div className="space-y-3">
                {["Triggers", "AI & Agents", "Tools & Data", "Outputs"].map((category) => (
                  <div key={category} className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase text-[#9CA3AF] font-semibold px-1">
                      {category}
                    </div>
                    {NODE_PALETTE.filter((n) => n.category === category).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => handleAddNode(item)}
                          className="w-full flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:border-black hover:bg-[#FAFAFA] transition-colors text-left group shadow-2xs"
                        >
                          <div className="h-7 w-7 rounded-lg bg-[#FAFAFA] group-hover:bg-black group-hover:text-white flex items-center justify-center text-black shrink-0 transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-black truncate">{item.title}</div>
                            <div className="text-[10px] text-[#6B7280] truncate font-sans">{item.description}</div>
                          </div>
                          <Plus className="h-3 w-3 text-[#9CA3AF] group-hover:text-black shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Center Interactive Workflow Canvas (6 cols) */}
            <div className="lg:col-span-6 rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col relative overflow-x-auto overflow-y-auto min-h-[480px]">
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage: "radial-gradient(circle, #E5E7EB 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative z-10 flex flex-col space-y-4 my-auto py-6">
                {selectedWorkflow?.nodes.map((node, index) => {
                  const isSelected = node.id === selectedNodeId;
                  return (
                    <React.Fragment key={node.id}>
                      {/* Node Card */}
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? "border-black bg-white ring-2 ring-black/10 shadow-sm"
                            : "border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white hover:border-[#D1D5DB]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#4B5563] font-semibold">
                              Step 0{index + 1}
                            </span>
                            <span className="text-xs font-bold text-black font-sans">{node.title}</span>
                          </div>

                          {/* Node Execution Status Badge */}
                          <div className="flex items-center gap-1.5">
                            {node.status === "running" && (
                              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
                            )}
                            {node.status === "success" && (
                              <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" />
                            )}
                            {node.status === "failed" && (
                              <XCircle weight="fill" className="h-4 w-4 text-red-500" />
                            )}
                            {node.durationMs !== undefined && (
                              <span className="text-[10px] font-mono text-[#6B7280]">
                                {node.durationMs}ms
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-[#6B7280] font-sans line-clamp-2">
                          {node.description}
                        </p>

                        {node.output && (
                          <div className="mt-2 pt-2 border-t border-[#E5E7EB] text-[11px] font-mono text-[#16A34A] truncate">
                            ✓ Output: {JSON.stringify(node.output).slice(0, 60)}...
                          </div>
                        )}
                      </div>

                      {/* Transition Edge Arrow */}
                      {index < (selectedWorkflow?.nodes.length || 0) - 1 && (
                        <div className="flex justify-center items-center py-0.5 text-[#9CA3AF]">
                          <ArrowRight weight="bold" className="h-4 w-4 rotate-90" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* 3. Right Node Inspector & Config Panel (3 cols) */}
            <div className="lg:col-span-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 flex flex-col justify-between space-y-4 overflow-y-auto max-h-[640px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <span className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                    Step Inspector
                  </span>
                  {selectedNode && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete Node"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {selectedNode ? (
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-medium text-black">Step Name</label>
                      <input
                        type="text"
                        value={selectedNode.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedWorkflow((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              nodes: prev.nodes.map((n) =>
                                n.id === selectedNode.id ? { ...n, title: val } : n
                              ),
                            };
                          });
                        }}
                        className="w-full h-8 px-2.5 mt-1 rounded-lg border border-[#E5E7EB] bg-white text-xs text-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-black">Type</label>
                      <div className="text-xs font-mono text-[#6B7280] mt-1 p-2 rounded-lg bg-white border border-[#E5E7EB]">
                        {selectedNode.type}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-black">Description</label>
                      <textarea
                        value={selectedNode.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedWorkflow((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              nodes: prev.nodes.map((n) =>
                                n.id === selectedNode.id ? { ...n, description: val } : n
                              ),
                            };
                          });
                        }}
                        rows={3}
                        className="w-full p-2.5 mt-1 rounded-lg border border-[#E5E7EB] bg-white text-xs text-black focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-black">Runtime Configuration</label>
                      <pre className="text-[10px] font-mono text-[#374151] p-2.5 rounded-lg bg-white border border-[#E5E7EB] mt-1 overflow-x-auto">
                        {JSON.stringify(selectedNode.config, null, 2) || "{}"}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs text-[#6B7280]">
                    Select a node to inspect and modify configuration parameters.
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] text-[10px] font-mono text-[#6B7280] flex justify-between">
                <span>DAG Engine: Realtime</span>
                <span>Active Nodes: {selectedWorkflow?.nodes.length || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Execution Telemetry View */
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-sm font-bold text-black font-sans">
                  Pipeline Execution Log
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {lastExecution ? `Execution ID: ${lastExecution.id} · Duration: ${lastExecution.durationMs}ms` : "No recent runs executed yet"}
                </p>
              </div>

              {lastExecution && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase ${
                    lastExecution.status === "completed"
                      ? "bg-green-50 text-[#16A34A] border border-green-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  {lastExecution.status}
                </span>
              )}
            </div>

            {lastExecution ? (
              <div className="space-y-3">
                {lastExecution.nodeExecutions.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2 font-mono text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" />
                        <span className="font-bold text-black">{step.nodeTitle}</span>
                        <span className="text-[10px] text-[#6B7280]">({step.nodeType})</span>
                      </div>
                      <span className="text-[#16A34A]">{step.durationMs}ms</span>
                    </div>

                    {step.output && (
                      <div className="bg-white p-2.5 rounded-lg border border-[#E5E7EB] text-[11px] text-[#374151] overflow-x-auto">
                        {JSON.stringify(step.output, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#6B7280] font-sans">
                Click &quot;Run Pipeline&quot; above to execute this workflow DAG and view live step-level outputs.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
