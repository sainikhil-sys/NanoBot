"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowClockwise,
  SkipForward,
  WarningCircle,
  TreeStructure,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import type {
  WorkflowExecutionRecord,
  NodeExecutionRecord,
  DeadLetterJob,
} from "@/lib/workflows/types";

type Tab = "runs" | "dead-letters";

function statusIcon(status: NodeExecutionRecord["status"] | WorkflowExecutionRecord["status"]) {
  switch (status) {
    case "success":
    case "completed":
      return <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" />;
    case "failed":
      return <XCircle weight="fill" className="h-4 w-4 text-red-500" />;
    case "skipped":
      return <SkipForward weight="fill" className="h-4 w-4 text-[#9CA3AF]" />;
    case "running":
      return <Clock weight="fill" className="h-4 w-4 text-blue-500 animate-pulse" />;
    default:
      return <Clock weight="regular" className="h-4 w-4 text-[#9CA3AF]" />;
  }
}

function NodeCard({ step, index }: { step: NodeExecutionRecord; index: number }) {
  const [open, setOpen] = useState(step.status === "failed");
  const failed = step.status === "failed";
  return (
    <div
      className={`rounded-xl border bg-[#FAFAFA] font-sans ${
        failed ? "border-red-200" : "border-[#E5E7EB]"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="h-5 w-5 rounded-md bg-black text-white flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
            {index + 1}
          </span>
          {statusIcon(step.status)}
          <span className="text-xs font-bold text-black truncate">{step.nodeTitle}</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#6B7280] shrink-0">
            {step.nodeType}
          </span>
          {typeof step.attempts === "number" && step.attempts > 1 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
              <ArrowClockwise className="h-3 w-3" /> {step.attempts} attempts
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-[#6B7280] shrink-0">
          {step.durationMs != null ? `${step.durationMs}ms` : "—"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2.5">
          {step.error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-[11px] text-red-700 font-mono">
              <div className="uppercase text-[10px] font-semibold mb-1 flex items-center gap-1">
                <WarningCircle weight="bold" className="h-3 w-3" />
                Error {step.nonRetryable ? "(non-retryable)" : "(retryable, exhausted)"}
              </div>
              {step.error}
            </div>
          )}
          {step.input && Object.keys(step.input).length > 0 && (
            <details className="bg-white p-3 rounded-lg border border-[#E5E7EB] font-mono text-[11px] text-[#374151]">
              <summary className="text-[10px] text-[#9CA3AF] uppercase font-semibold cursor-pointer">
                Input (secrets masked)
              </summary>
              <pre className="mt-2 overflow-x-auto">{JSON.stringify(step.input, null, 2)}</pre>
            </details>
          )}
          {step.output && (
            <details open className="bg-white p-3 rounded-lg border border-[#E5E7EB] font-mono text-[11px] text-[#374151]">
              <summary className="text-[10px] text-[#9CA3AF] uppercase font-semibold cursor-pointer">
                Output
              </summary>
              <pre className="mt-2 overflow-x-auto">{JSON.stringify(step.output, null, 2)}</pre>
            </details>
          )}
          {step.logs && step.logs.length > 0 && (
            <div className="bg-black rounded-lg p-3 font-mono text-[10px] text-neutral-300 space-y-0.5 overflow-x-auto">
              {step.logs.map((l, i) => (
                <div key={i}>
                  <span className="text-neutral-500">{new Date(l.ts).toLocaleTimeString()} </span>
                  <span
                    className={
                      l.level === "error"
                        ? "text-red-400"
                        : l.level === "warn"
                        ? "text-amber-400"
                        : "text-neutral-300"
                    }
                  >
                    [{l.level}] {l.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionsPage() {
  const [tab, setTab] = useState<Tab>("runs");
  const [executions, setExecutions] = useState<WorkflowExecutionRecord[]>([]);
  const [deadLetters, setDeadLetters] = useState<DeadLetterJob[]>([]);
  const [selected, setSelected] = useState<WorkflowExecutionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [rRes, dRes] = await Promise.all([
        fetch("/api/workflows/execute"),
        fetch("/api/workflows/dead-letters"),
      ]);
      if (rRes.ok) {
        const data = await rRes.json();
        setExecutions(data.executions || []);
        setSelected((prev) => prev ?? data.executions?.[0] ?? null);
      }
      if (dRes.ok) {
        const data = await dRes.json();
        setDeadLetters(data.deadLetters || []);
      }
    } catch (err) {
      console.error("Failed to load executions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleReplay = async (job: DeadLetterJob) => {
    setReplayingId(job.id);
    try {
      const res = await fetch(`/api/workflows/dead-letters/${job.id}/replay`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await load();
        setTab("runs");
        setSelected(data.execution || null);
      }
    } finally {
      setReplayingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Executions"
        description="Full run traces — node status, durations, retries, masked I/O, logs and dead letters."
        action={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-semibold text-black shadow-2xs"
          >
            <ArrowsClockwise className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        }
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("runs")}
            className={`h-8 px-4 rounded-xl text-xs font-semibold transition-colors ${
              tab === "runs" ? "bg-black text-white" : "bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            Runs ({executions.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("dead-letters")}
            className={`h-8 px-4 rounded-xl text-xs font-semibold transition-colors ${
              tab === "dead-letters"
                ? "bg-black text-white"
                : "bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]"
            }`}
          >
            Dead Letters ({deadLetters.length})
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] animate-pulse" />
              ))}
            </div>
            <div className="lg:col-span-7 h-[400px] rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] animate-pulse" />
          </div>
        ) : tab === "runs" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Run list */}
            <div className="lg:col-span-5 space-y-3">
              {executions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6B7280] border border-dashed border-[#E5E7EB] rounded-2xl bg-[#FAFAFA]">
                  No runs yet. Execute a workflow or an automation to record a run.
                </div>
              ) : (
                <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                  {executions.map((exec) => {
                    const isSelected = exec.id === selected?.id;
                    return (
                      <button
                        type="button"
                        key={exec.id}
                        onClick={() => setSelected(exec)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all space-y-2.5 shadow-2xs ${
                          isSelected
                            ? "border-black bg-white ring-2 ring-black/10"
                            : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-black/30 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {statusIcon(exec.status)}
                            <h3 className="text-xs font-bold text-black truncate">{exec.workflowName}</h3>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase shrink-0 ${
                              exec.status === "completed"
                                ? "bg-green-50 text-[#16A34A] border border-green-200"
                                : exec.status === "failed"
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : "bg-neutral-100 text-[#6B7280] border border-[#E5E7EB]"
                            }`}
                          >
                            {exec.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                          <span className="truncate">{exec.trigger}{exec.workflowVersion ? ` · v${exec.workflowVersion}` : ""}</span>
                          <span>{exec.durationMs != null ? `${Math.round(exec.durationMs)}ms` : "—"}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inspector */}
            <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-6 shadow-2xs min-h-[580px]">
              {selected ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#E5E7EB] text-[#4B5563] font-semibold">
                          RUN TRACE
                        </span>
                        <h3 className="text-sm font-bold text-black">{selected.workflowName}</h3>
                      </div>
                      <p className="text-[11px] font-mono text-[#6B7280] mt-1">
                        {selected.id} · {new Date(selected.startedAt).toLocaleString()} · trigger: {selected.trigger}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-black">
                        {selected.durationMs != null ? `${Math.round(selected.durationMs)}ms` : "—"}
                      </div>
                      <div
                        className={`text-[10px] font-semibold uppercase ${
                          selected.status === "completed" ? "text-[#16A34A]" : "text-red-600"
                        }`}
                      >
                        {selected.nodeExecutions.filter((n) => n.status === "success").length}/
                        {selected.nodeExecutions.length} nodes ok
                      </div>
                    </div>
                  </div>

                  {selected.deadLettered && selected.error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <WarningCircle weight="bold" className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Run failed and was dead-lettered</div>
                        <div className="font-mono text-[11px] mt-0.5">{selected.error}</div>
                        <div className="mt-1 text-[11px]">
                          Retry it from the{" "}
                          <button type="button" onClick={() => setTab("dead-letters")} className="underline font-semibold">
                            Dead Letters
                          </button>{" "}
                          tab.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="text-xs font-mono uppercase text-[#6B7280] font-semibold">
                      Node execution sequence
                    </div>
                    {selected.nodeExecutions.map((step, idx) => (
                      <NodeCard key={step.nodeId + idx} step={step} index={idx} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-[#6B7280]">
                  Select a run to inspect its node trace, retries, I/O and logs.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dead letters tab */
          <div className="space-y-4">
            {deadLetters.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-[#E5E7EB] rounded-2xl bg-[#FAFAFA]">
                <div className="h-12 w-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
                  <TreeStructure weight="bold" className="h-5 w-5 text-[#16A34A]" />
                </div>
                <h3 className="text-sm font-bold text-black">No dead-lettered jobs</h3>
                <p className="text-xs text-[#6B7280] mt-1">
                  Permanently failed runs land here with their error and input so you can replay them.
                </p>
              </div>
            ) : (
              deadLetters.map((job) => (
                <div key={job.id} className="p-5 rounded-2xl border border-red-200 bg-white shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <XCircle weight="fill" className="h-4 w-4 text-red-500 shrink-0" />
                        <h3 className="text-sm font-bold text-black truncate">{job.workflowName}</h3>
                      </div>
                      <p className="text-[11px] font-mono text-[#6B7280] mt-1">
                        failed node: {job.failedNodeTitle || job.failedNodeId || "—"} · {job.attempts} attempt(s) ·{" "}
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          const run = executions.find((r) => r.id === job.runId);
                          if (run) {
                            setSelected(run);
                            setTab("runs");
                          }
                        }}
                        className="h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-semibold text-black flex items-center"
                      >
                        View trace
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleReplay(job)}
                        disabled={replayingId === job.id}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-black text-white hover:bg-neutral-900 text-xs font-semibold disabled:opacity-50"
                      >
                        <ArrowClockwise className={`h-3 w-3 ${replayingId === job.id ? "animate-spin" : ""}`} />
                        <span>{replayingId === job.id ? "Replaying…" : "Replay"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-[11px] text-red-700 font-mono">
                    {job.error}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
