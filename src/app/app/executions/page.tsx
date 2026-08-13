"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  ChartLine,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  ArrowRight,
  Sparkle,
  TreeStructure,
} from "@phosphor-icons/react";
import { WorkflowExecutionRecord } from "@/lib/workflows/types";

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<WorkflowExecutionRecord[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecutionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExecutions() {
      try {
        const res = await fetch("/api/workflows/execute");
        if (res.ok) {
          const data = await res.json();
          setExecutions(data.executions || []);
          if (data.executions?.length > 0) {
            setSelectedExecution(data.executions[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load executions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadExecutions();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Execution Center"
        description="Structured telemetry, DAG run logs, step durations, and payload outputs"
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Studio 2-Column Grid: Executions List (5 cols) | Run Inspector (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Left Executions List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-black uppercase tracking-wider font-mono">
                Recent Pipeline Runs ({executions.length})
              </span>
              <span className="text-[10px] font-mono text-[#6B7280]">Realtime telemetry</span>
            </div>

            <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
              {executions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#6B7280] border border-[#E5E7EB] rounded-2xl bg-[#FAFAFA]">
                  No workflow executions recorded yet. Run a pipeline from the Workflows studio to inspect outputs.
                </div>
              ) : (
                executions.map((exec) => {
                  const isSelected = exec.id === selectedExecution?.id;
                  const isSuccess = exec.status === "completed";

                  return (
                    <div
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 shadow-2xs ${
                        isSelected
                          ? "border-black bg-white ring-2 ring-black/10"
                          : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-black/30 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isSuccess ? (
                            <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" />
                          ) : (
                            <XCircle weight="fill" className="h-4 w-4 text-red-500" />
                          )}
                          <h3 className="text-xs font-bold text-black font-sans truncate">
                            {exec.workflowName}
                          </h3>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                            isSuccess
                              ? "bg-green-50 text-[#16A34A] border border-green-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {exec.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-[#6B7280] pt-1 border-t border-[#E5E7EB]">
                        <span>ID: {exec.id.slice(0, 15)}</span>
                        <span>{exec.durationMs}ms</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 2. Right Execution DAG Inspector */}
          <div className="lg:col-span-7 rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-6 shadow-2xs min-h-[580px]">
            {selectedExecution ? (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#E5E7EB] text-[#4B5563] font-semibold">
                        EXECUTION TRACE
                      </span>
                      <h3 className="text-sm font-bold text-black font-sans">{selectedExecution.workflowName}</h3>
                    </div>
                    <p className="text-xs font-mono text-[#6B7280] mt-1">
                      Started: {selectedExecution.startedAt} · Trigger: {selectedExecution.trigger}
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-black">{selectedExecution.durationMs}ms</div>
                    <div className="text-[10px] text-[#16A34A] font-semibold uppercase">
                      {selectedExecution.nodeExecutions.length} Steps Completed
                    </div>
                  </div>
                </div>

                {/* Step DAG List */}
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase text-[#6B7280] font-semibold">
                    Step Execution Sequence & Node Telemetry
                  </div>

                  {selectedExecution.nodeExecutions.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2.5 font-sans"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="h-5 w-5 rounded-md bg-black text-white flex items-center justify-center font-mono text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-black">{step.nodeTitle}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[#6B7280]">
                            {step.nodeType}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#16A34A] font-semibold">
                          {step.durationMs}ms
                        </span>
                      </div>

                      {step.output && (
                        <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] font-mono text-[11px] text-[#374151] space-y-1 overflow-x-auto">
                          <div className="text-[10px] text-[#9CA3AF] uppercase font-semibold">Node Output Payload</div>
                          <pre>{JSON.stringify(step.output, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-[#6B7280] font-sans">
                Select an execution run from the left panel to inspect step telemetry and node payloads.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
