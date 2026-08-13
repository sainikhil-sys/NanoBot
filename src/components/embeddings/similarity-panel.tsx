"use client";

import React, { useState } from "react";
import { ArrowsLeftRight, Sparkle } from "@phosphor-icons/react";

interface SimilarityPanelProps {
  inputText: string;
  onCompare: (compareText: string) => void;
  similarity: number | null;
  isLoading: boolean;
}

export function SimilarityPanel({
  inputText,
  onCompare,
  similarity,
  isLoading,
}: SimilarityPanelProps) {
  const [compareInput, setCompareInput] = useState("machine learning");

  const handleRunComparison = () => {
    onCompare(compareInput);
  };

  const getSimilarityBadge = (sim: number) => {
    if (sim >= 0.8) return { label: "High Semantic Similarity", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (sim >= 0.4) return { label: "Moderate Similarity", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Low Similarity / Unrelated", color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  return (
    <div className="space-y-6">
      {/* Comparison Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Input A */}
        <div className="p-5 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] space-y-2">
          <span className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">
            Input Vector A (Target)
          </span>
          <div className="p-3 rounded-xl bg-white border border-[#EBEBEB] text-sm font-semibold text-black font-sans truncate">
            {inputText || "No primary text entered"}
          </div>
        </div>

        {/* Input B */}
        <div className="p-5 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] space-y-2">
          <span className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">
            Input Vector B (Comparison)
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={compareInput}
              onChange={(e) => setCompareInput(e.target.value)}
              placeholder="Enter comparison word..."
              className="flex-1 px-3.5 h-10 rounded-xl border border-[#EBEBEB] bg-white text-sm text-black focus:outline-none focus:border-black font-sans"
            />
            <button
              type="button"
              onClick={handleRunComparison}
              disabled={isLoading}
              className="px-4 h-10 rounded-xl bg-black text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors shrink-0 shadow-2xs"
            >
              {isLoading ? "Calculating..." : "Compare"}
            </button>
          </div>
        </div>
      </div>

      {/* Similarity Score Metric Gauge */}
      {similarity !== null ? (
        <div className="p-8 rounded-3xl border border-[#EBEBEB] bg-white text-center space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-sans font-medium ${getSimilarityBadge(similarity).color}">
            <Sparkle className="h-3.5 w-3.5" />
            <span>{getSimilarityBadge(similarity).label}</span>
          </div>

          <div className="space-y-1">
            <div className="text-[48px] font-mono font-bold text-black leading-none">
              {(similarity * 100).toFixed(1)}%
            </div>
            <div className="text-xs font-mono text-neutral-500">
              Cosine Similarity Score: <span className="text-black font-bold">{similarity.toFixed(4)}</span>
            </div>
          </div>

          {/* Progress Distance Bar */}
          <div className="max-w-md mx-auto space-y-1">
            <div className="h-3 w-full bg-[#FAFAFA] rounded-full border border-[#EBEBEB] p-0.5 overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, Math.min(100, (similarity + 1) * 50))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-neutral-400">
              <span>-1.0 (Opposite)</span>
              <span>0.0 (Orthogonal)</span>
              <span>+1.0 (Identical)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-neutral-400 font-sans border border-dashed border-[#EBEBEB] rounded-2xl">
          Click &quot;Compare&quot; to compute true mathematical Cosine Similarity between Input A and Input B.
        </div>
      )}
    </div>
  );
}
