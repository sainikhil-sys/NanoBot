"use client";

import React, { useState } from "react";
import {
  Cpu,
  Hash,
  Timer,
  Stack,
  TreeStructure,
  CaretDown,
  CaretUp,
  Sparkle,
} from "@phosphor-icons/react";

export interface DeepLearningMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  architecture: string;
  provider: string;
  dimensions?: number;
  retrievedChunks?: Array<{
    id: string;
    title: string;
    source: string;
    score: number;
  }>;
}

interface DeepLearningInspectorProps {
  metrics: DeepLearningMetrics;
}

export function DeepLearningInspector({ metrics }: DeepLearningInspectorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs font-sans select-none overflow-hidden transition-all shadow-2xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-neutral-100/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-[#EAF7EE] text-[#16A34A] flex items-center justify-center font-mono text-[10px] font-bold">
            DL
          </div>
          <span className="font-semibold text-black">
            Deep Learning Model Telemetry
          </span>
          <span className="text-[10px] font-mono text-[#6B7280]">
            {metrics.model} · {metrics.totalTokens} tokens
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#6B7280]">
          <span className="text-[11px] font-mono">{metrics.latencyMs} ms</span>
          {expanded ? <CaretUp className="h-3.5 w-3.5" /> : <CaretDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3.5 pt-0 border-t border-[#E5E7EB] space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-[10px] font-mono uppercase text-[#6B7280]">Architecture</div>
              <div className="font-semibold text-black text-xs truncate mt-0.5" title={metrics.architecture}>
                {metrics.architecture}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-[10px] font-mono uppercase text-[#6B7280]">Tokens (In / Out)</div>
              <div className="font-mono font-bold text-black text-xs mt-0.5">
                {metrics.inputTokens} / {metrics.outputTokens}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-[10px] font-mono uppercase text-[#6B7280]">Vector Space</div>
              <div className="font-mono font-bold text-black text-xs mt-0.5">
                {metrics.dimensions || 1536} Dims
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-[10px] font-mono uppercase text-[#6B7280]">Total Latency</div>
              <div className="font-mono font-bold text-black text-xs mt-0.5">
                {metrics.latencyMs} ms
              </div>
            </div>
          </div>

          {metrics.retrievedChunks && metrics.retrievedChunks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-mono uppercase text-[#6B7280]">
                RAG Cosine Similarity Ranking (Top-K Chunks)
              </div>
              <div className="space-y-1">
                {metrics.retrievedChunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-2 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2 text-black font-medium">
                      {idx + 1}. {chunk.title} <span className="text-[#6B7280] font-normal font-mono text-[10px]">({chunk.source})</span>
                    </div>
                    <div className="px-2 py-0.5 rounded bg-[#EAF7EE] text-[#16A34A] font-mono text-[10px] font-bold shrink-0">
                      cos θ = {chunk.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
