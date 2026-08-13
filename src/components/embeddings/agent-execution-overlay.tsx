"use client";

import React from "react";
import { AgentStepItem, StepState } from "./agent-step-item";
import { AgentPipeline, PipelineNodeStatus } from "./agent-pipeline";
import { X, ArrowClockwise, WarningOctagon, Cpu, Stack, Hash } from "@phosphor-icons/react";

export interface AgentExecutionState {
  isActive: boolean;
  isCompleted: boolean;
  error: { step: string; message: string } | null;
  progress: number;
  currentStepId: string;
  steps: {
    id: string;
    label: string;
    submessage?: string | null;
    state: StepState;
  }[];
  metadata: {
    model: string;
    chunksCount: number;
    dimensions: number;
    filename?: string | null;
  };
}

interface AgentExecutionOverlayProps {
  state: AgentExecutionState;
  onCancel: () => void;
  onRetry: () => void;
}

export function AgentExecutionOverlay({
  state,
  onCancel,
  onRetry,
}: AgentExecutionOverlayProps) {
  if (!state.isActive && !state.error) return null;

  // Map execution steps to visual pipeline nodes
  const pipelineNodes: PipelineNodeStatus[] = [
    {
      key: "input",
      label: "Input",
      state: state.error && state.currentStepId === "input_received"
        ? "error"
        : state.steps.find((s) => s.id === "input_received")?.state === "complete"
        ? "complete"
        : state.currentStepId === "input_received"
        ? "active"
        : "pending",
    },
    {
      key: "process",
      label: "Process",
      state: state.error && (state.currentStepId === "text_extraction" || state.currentStepId === "text_cleaning")
        ? "error"
        : state.steps.find((s) => s.id === "text_cleaning")?.state === "complete"
        ? "complete"
        : state.currentStepId === "text_extraction" || state.currentStepId === "text_cleaning"
        ? "active"
        : "pending",
    },
    {
      key: "chunk",
      label: "Chunk",
      state: state.error && state.currentStepId === "chunking"
        ? "error"
        : state.steps.find((s) => s.id === "chunking")?.state === "complete"
        ? "complete"
        : state.currentStepId === "chunking"
        ? "active"
        : "pending",
    },
    {
      key: "embed",
      label: "Embed",
      state: state.error && state.currentStepId === "embedding"
        ? "error"
        : state.steps.find((s) => s.id === "embedding")?.state === "complete"
        ? "complete"
        : state.currentStepId === "embedding"
        ? "active"
        : "pending",
    },
    {
      key: "vectordb",
      label: "Vector DB",
      state: state.error && state.currentStepId === "vector_storage"
        ? "error"
        : state.steps.find((s) => s.id === "vector_storage")?.state === "complete"
        ? "complete"
        : state.currentStepId === "vector_storage"
        ? "active"
        : "pending",
    },
    {
      key: "done",
      label: "Done",
      state: state.isCompleted ? "complete" : "pending",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn"
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Glassmorphic Live Agent Card */}
      <div className="w-full max-w-xl rounded-2xl border border-[#E5E7EB] bg-white/95 p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-mono text-xs font-bold shadow-2xs">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold text-black font-sans tracking-tight">
                  NanoBot Agent
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EAF7EE] border border-[#16A34A]/20 text-[10px] font-mono uppercase text-[#16A34A] font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] font-sans mt-0.5">
                {state.error ? "Execution paused due to error" : "Processing your input in real time"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors"
            title="Cancel Processing"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Visual Pipeline Nodes */}
        <AgentPipeline nodes={pipelineNodes} />

        {/* Error Notification Card if Failed */}
        {state.error ? (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 space-y-3">
            <div className="flex items-start gap-2.5">
              <WarningOctagon weight="fill" className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-900 font-sans">
                  Execution Failed at step: <span className="font-mono">{state.error.step}</span>
                </div>
                <p className="text-xs text-rose-700 font-sans leading-relaxed">
                  {state.error.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium font-sans shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium font-sans shadow-xs"
              >
                <ArrowClockwise weight="bold" className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : (
          /* Live Steps List */
          <div className="space-y-1 divide-y divide-neutral-100">
            {state.steps.map((step) => (
              <AgentStepItem
                key={step.id}
                label={step.label}
                submessage={step.submessage}
                state={step.state}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#6B7280]">
              {state.error ? "Failed" : state.progress >= 100 ? "Completed" : "Executing..."}
            </span>
            <span className="font-bold text-black">{state.progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                state.error ? "bg-rose-500" : "bg-[#16A34A]"
              }`}
              style={{ width: `${Math.max(5, state.progress)}%` }}
            />
          </div>
        </div>

        {/* Live Metadata Badges */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5E7EB] text-center">
          <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#6B7280] uppercase">
              <Cpu className="h-3 w-3" />
              <span>Model</span>
            </div>
            <div className="text-[11px] font-mono font-semibold text-black truncate mt-0.5" title={state.metadata.model}>
              {state.metadata.model}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#6B7280] uppercase">
              <Stack className="h-3 w-3" />
              <span>Chunks</span>
            </div>
            <div className="text-[12px] font-mono font-semibold text-black mt-0.5">
              {state.metadata.chunksCount || 1} chunks
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB]">
            <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-[#6B7280] uppercase">
              <Hash className="h-3 w-3" />
              <span>Dimensions</span>
            </div>
            <div className="text-[12px] font-mono font-semibold text-black mt-0.5">
              {state.metadata.dimensions?.toLocaleString() || "1,536"} dims
            </div>
          </div>
        </div>

        {/* Footer Cancel Action */}
        {!state.error && (
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-sans text-[#6B7280] hover:text-black transition-colors"
            >
              Cancel Processing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
