"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Task, TaskStep, TaskEvent } from "@/types/database.types";
import { Header } from "@/components/layout/header";
import { StatusPill } from "@/components/ui/status-pill";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ExecutionGraph } from "@/components/execution/execution-graph";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowClockwise,
  Terminal,
  TreeStructure,
  Sliders,
  CheckCircle,
  Copy,
  MagnifyingGlass,
  FileCode,
} from "@phosphor-icons/react";

export default function TaskExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<TaskStep | null>(null);
  const [activeTab, setActiveTab] = useState<string>("level1");
  const [logFilter, setLogFilter] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Initial fetch + Realtime SSE Stream connection
  useEffect(() => {
    let eventSource: EventSource | null = null;

    async function loadInitial() {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (res.ok) {
          const data = await res.json();
          setTask(data.task);
          if (data.task.steps && data.task.steps.length > 0) {
            setSelectedStep(data.task.steps[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load task:", err);
      } finally {
        setLoading(false);
      }

      // Connect to SSE stream
      try {
        eventSource = new EventSource(`/api/tasks/${taskId}/stream`);

        eventSource.addEventListener("init", (e) => {
          const initTask = JSON.parse(e.data);
          setTask(initTask);
        });

        eventSource.addEventListener("task_event", (e) => {
          const payload = JSON.parse(e.data);
          if (payload.task) {
            setTask(payload.task);
          }
        });

        eventSource.onerror = () => {
          eventSource?.close();
        };
      } catch (e) {
        console.error("SSE connection error:", e);
      }
    }

    if (taskId) {
      loadInitial();
    }

    return () => {
      eventSource?.close();
    };
  }, [taskId]);

  const copyResult = () => {
    if (task?.result?.output_text) {
      navigator.clipboard.writeText(task.result.output_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!task?.events) return [];
    if (!logFilter.trim()) return task.events;
    const q = logFilter.toLowerCase();
    return task.events.filter(
      (ev) =>
        ev.message.toLowerCase().includes(q) ||
        ev.layer.toLowerCase().includes(q) ||
        ev.level.toLowerCase().includes(q)
    );
  }, [task?.events, logFilter]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header title="Execution Trace" />
        <main className="p-8 max-w-7xl mx-auto w-full space-y-4">
          <div className="h-28 bg-[#FAFAFA] border border-[#EBEBEB] rounded-3xl animate-pulse" />
          <div className="h-64 bg-[#FAFAFA] border border-[#EBEBEB] rounded-3xl animate-pulse" />
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header title="Execution Trace" />
        <main className="p-16 text-center max-w-md mx-auto space-y-4">
          <h2 className="text-[17px] font-semibold text-black font-sans">Task Not Found</h2>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            The requested task execution trace does not exist in the database.
          </p>
          <button
            onClick={() => router.push("/app/tasks")}
            className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-black text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            Return to Tasks
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 bg-white">
      <Header
        title="Execution Trace"
        description={task.id}
        actions={
          <button
            onClick={() => router.push("/app/tasks")}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-medium text-black font-sans transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Tasks</span>
          </button>
        }
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Task Header Card */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-mono font-semibold text-neutral-400 uppercase">
                  {task.id.slice(0, 18)}
                </span>
                <StatusPill status={task.status} />
                {task.bot && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] text-neutral-700 font-medium">
                    {task.bot.name}
                  </span>
                )}
                <span className="text-[11px] font-mono text-neutral-400">
                  Created {formatDate(task.created_at)}
                </span>
              </div>
              <h2 className="text-[18px] font-semibold text-black tracking-tight font-sans break-words">
                {task.title}
              </h2>
            </div>

            {/* Task Duration & Actions */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block p-3 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA]">
                <div className="text-[9px] uppercase font-mono text-neutral-400 tracking-wider">
                  Total Duration
                </div>
                <div className="text-xs font-mono font-semibold text-black mt-0.5">
                  {task.completed_at && task.started_at
                    ? formatDuration(
                        new Date(task.completed_at).getTime() -
                          new Date(task.started_at).getTime()
                      )
                    : task.status === "running"
                    ? "Executing..."
                    : "--"}
                </div>
              </div>

              {task.status === "failed" && (
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#EBEBEB] bg-white hover:bg-neutral-50 text-xs font-medium text-black transition-colors"
                >
                  <ArrowClockwise className="h-3.5 w-3.5" />
                  <span>Retry Pipeline</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Dynamic Execution Graph */}
        {task.steps && task.steps.length > 0 && (
          <ExecutionGraph steps={task.steps} />
        )}

        {/* Three Levels of Transparency Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#EBEBEB] pb-3">
            <TabsList className="bg-[#FAFAFA] border border-[#EBEBEB] p-1 rounded-2xl gap-1">
              <TabsTrigger value="level1" className="gap-1.5 text-xs font-sans rounded-xl data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-2xs">
                <TreeStructure className="h-3.5 w-3.5" />
                <span>Level 1: Pipeline Overview</span>
              </TabsTrigger>
              <TabsTrigger value="level2" className="gap-1.5 text-xs font-sans rounded-xl data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-2xs">
                <Sliders className="h-3.5 w-3.5" />
                <span>Level 2: Technical Stages ({task.steps?.length || 0})</span>
              </TabsTrigger>
              <TabsTrigger value="level3" className="gap-1.5 text-xs font-sans rounded-xl data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-2xs">
                <Terminal className="h-3.5 w-3.5" />
                <span>Level 3: Event Log ({task.events?.length || 0})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Level 1: User-friendly Pipeline */}
          <TabsContent value="level1" className="mt-0">
            <div className="rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-xs">
              <div className="text-[16px] font-semibold text-black font-sans mb-5">
                End-to-End Orchestration Pipeline
              </div>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {[
                  { key: "input", label: "Input", desc: "Validation & Intake" },
                  { key: "understanding", label: "Understanding", desc: "Semantic Analysis" },
                  { key: "orchestration", label: "Orchestration", desc: "Capability Graph" },
                  { key: "preprocessing", label: "Preprocessing", desc: "Tensor Norm / Tokenize" },
                  { key: "deep_learning", label: "Deep Learning", desc: "Inference Layer" },
                  { key: "validation", label: "Validation", desc: "Schema Verification" },
                  { key: "response", label: "Response", desc: "Synthesized Output" },
                ].map((stage, i) => {
                  const stepMatch = task.steps?.find((s) => s.layer === stage.key);
                  const isDone = stepMatch ? stepMatch.status === "completed" : task.status === "completed";
                  const isRunning = stepMatch ? stepMatch.status === "running" : false;

                  return (
                    <div
                      key={stage.key}
                      className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-neutral-400 font-semibold">
                            0{i + 1}
                          </span>
                          <StatusPill status={isDone ? "completed" : isRunning ? "running" : "waiting"} showDot={false} />
                        </div>
                        <div className="text-[13px] font-semibold text-black font-sans">
                          {stage.label}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-sans leading-tight">
                          {stage.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Level 2: Technical Pipeline with Step Durations & Metadata */}
          <TabsContent value="level2" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-3.5">
                {task.steps?.map((step) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedStep?.id === step.id
                        ? "border-black bg-white shadow-xs ring-1 ring-black"
                        : "border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-neutral-400">
                          #{step.step_order}
                        </span>
                        <span className="text-[13px] font-semibold text-black font-sans">
                          {step.step_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.duration_ms !== null && step.duration_ms !== undefined && (
                          <span className="text-[11px] font-mono text-neutral-400">
                            {formatDuration(step.duration_ms)}
                          </span>
                        )}
                        <StatusPill status={step.status} />
                      </div>
                    </div>

                    <p className="text-[12px] text-neutral-500 mb-3 font-sans">
                      {step.message || "Stage execution parameter verified."}
                    </p>

                    <Progress value={step.progress} className="h-1 bg-neutral-200" />
                  </div>
                ))}
              </div>

              {/* Selected Step Inspector */}
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#EBEBEB] bg-white p-6 shadow-xs space-y-4">
                  <div className="text-[11px] uppercase tracking-wider font-mono text-neutral-400 font-semibold pb-3 border-b border-[#EBEBEB]">
                    Stage Telemetry
                  </div>
                  <div className="space-y-3.5 text-[13px] font-sans">
                    {selectedStep ? (
                      <>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase font-mono">
                            Stage Name
                          </div>
                          <div className="font-semibold text-black mt-0.5">
                            {selectedStep.step_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase font-mono">
                            Layer Type
                          </div>
                          <div className="font-mono text-neutral-700 mt-0.5 text-xs">
                            {selectedStep.layer}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase font-mono">
                            Progress
                          </div>
                          <div className="font-mono text-neutral-900 mt-0.5 font-semibold">
                            {selectedStep.progress}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 uppercase font-mono">
                            Timing
                          </div>
                          <div className="font-mono text-neutral-900 mt-0.5 font-semibold">
                            {selectedStep.duration_ms
                              ? `${selectedStep.duration_ms} ms`
                              : "--"}
                          </div>
                        </div>
                        {selectedStep.metadata &&
                          Object.keys(selectedStep.metadata).length > 0 && (
                            <div>
                              <div className="text-[10px] text-neutral-400 uppercase font-mono mb-1.5">
                                Extracted Metadata
                              </div>
                              <pre className="p-3 rounded-xl bg-[#FAFAFA] text-[10px] font-mono overflow-x-auto text-black border border-[#EBEBEB]">
                                {JSON.stringify(selectedStep.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                      </>
                    ) : (
                      <p className="text-neutral-400 text-xs font-sans">
                        Select a stage to inspect its layer telemetry.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Level 3: Execution Event Log */}
          <TabsContent value="level3" className="mt-0">
            <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
              <div className="flex flex-row items-center justify-between p-6 border-b border-[#EBEBEB]">
                <h3 className="text-[16px] font-semibold text-black font-sans">
                  Execution Event Stream
                </h3>
                <div className="relative w-64">
                  <MagnifyingGlass className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Filter events..."
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="h-8 w-full pl-9 pr-3 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-[11px] font-sans text-black focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="rounded-2xl border border-neutral-800 bg-[#0A0A0A] text-neutral-100 p-4 font-mono text-[11px] max-h-[420px] overflow-y-auto space-y-1.5">
                  {filteredEvents.length === 0 ? (
                    <div className="text-neutral-500 py-6 text-center">
                      No matching execution events recorded yet.
                    </div>
                  ) : (
                    filteredEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 hover:bg-white/5 p-1 rounded transition-colors"
                      >
                        <span className="text-neutral-500 shrink-0">
                          {new Date(ev.created_at).toLocaleTimeString("en-US", {
                            hour12: false,
                          })}
                        </span>
                        <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 bg-neutral-800 text-neutral-300">
                          {ev.level}
                        </span>
                        <span className="text-neutral-400 shrink-0 uppercase text-[9px]">
                          [{ev.layer}]
                        </span>
                        <span className="text-neutral-200 break-all">
                          {ev.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Synthesized Output & Artifact Inspector */}
        {task.result && (
          <div className="rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-xs space-y-5">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-[#EBEBEB]">
              <div className="flex items-center gap-2.5">
                <CheckCircle
                  weight="bold"
                  className="h-5 w-5 text-black"
                />
                <h3 className="text-[16px] font-semibold text-black font-sans">
                  Execution Result & Artifacts
                </h3>
              </div>
              <button
                onClick={copyResult}
                className="inline-flex items-center gap-1.5 px-4 h-8 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-medium text-black font-sans transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? "Copied" : "Copy Output"}</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Rendered Text output */}
              {task.result.output_text && (
                <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#EBEBEB] text-black leading-relaxed whitespace-pre-wrap font-sans text-[13px]">
                  {task.result.output_text}
                </div>
              )}

              {/* Execution Metrics Bar */}
              {task.result.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                  {Object.entries(task.result.metrics).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3.5 rounded-2xl border border-[#EBEBEB] bg-white shadow-2xs"
                    >
                      <div className="text-[10px] font-mono uppercase text-neutral-400 truncate">
                        {key.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs font-mono font-semibold text-black mt-1">
                        {typeof val === "number" && key.includes("duration")
                          ? formatDuration(val)
                          : String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional Artifacts Grid if present */}
              {task.result.artifacts && Object.keys(task.result.artifacts).length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-black mb-2 flex items-center gap-1.5 font-sans">
                    <FileCode className="h-4 w-4 text-neutral-500" />
                    <span>Deep-Learning Artifacts Payload</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EBEBEB] text-[11px] font-mono text-black overflow-x-auto">
                    {JSON.stringify(task.result.artifacts, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
