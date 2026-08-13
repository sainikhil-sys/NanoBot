"use client";

import React, { useState } from "react";
import { Copy, Download, Check, ChartBar } from "@phosphor-icons/react";

interface VectorDisplayProps {
  vector: number[];
  dimensions: number;
  magnitude: number;
  model: string;
}

export function VectorDisplay({ vector, dimensions, magnitude, model }: VectorDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayedVector = showAll ? vector : vector.slice(0, 32);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(vector));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify({ model, dimensions, magnitude, vector }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `embedding_vector_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-black font-sans">
              Raw Embedding Vector
            </span>
            <span className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-mono font-medium">
              {dimensions} Dimensions
            </span>
          </div>
          <p className="text-[12px] text-neutral-500 font-sans">
            Model: <span className="font-mono text-black">{model}</span> · Magnitude ||v||:{" "}
            <span className="font-mono text-black">{magnitude}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-xl border border-[#EBEBEB] bg-white hover:border-black text-xs font-medium text-black transition-colors shadow-2xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Vector"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Vector Heatmap Visualizer */}
      <div className="p-5 rounded-2xl border border-[#EBEBEB] bg-white space-y-3 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="font-semibold text-black flex items-center gap-1.5">
            <ChartBar className="h-4 w-4 text-neutral-600" />
            Vector Heatmap Bar (Dimension Intensity)
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            negative (blue) ← 0 → positive (emerald)
          </span>
        </div>

        <div className="flex items-center gap-0.5 h-8 w-full bg-[#FAFAFA] p-1 rounded-xl border border-[#EBEBEB] overflow-hidden">
          {vector.slice(0, 128).map((val, idx) => {
            const normalized = Math.max(-1, Math.min(1, val * 3));
            const bgClass =
              normalized > 0.1
                ? "bg-emerald-500"
                : normalized < -0.1
                ? "bg-blue-500"
                : "bg-neutral-300";
            const opacity = Math.min(1, Math.abs(normalized) + 0.2);

            return (
              <div
                key={idx}
                className={`h-full flex-1 rounded-xs ${bgClass} transition-all hover:scale-125`}
                style={{ opacity }}
                title={`[${idx}]: ${val.toFixed(6)}`}
              />
            );
          })}
        </div>
      </div>

      {/* Raw Vector Grid Values */}
      <div className="rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase font-semibold text-neutral-500">
            Showing {displayedVector.length} of {dimensions} Vector Values
          </span>
          {dimensions > 32 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-neutral-700 hover:text-black font-sans underline"
            >
              {showAll ? "Show First 32" : `Show All ${dimensions}`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {displayedVector.map((val, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-white border border-[#EBEBEB] text-center font-mono text-[11px]"
            >
              <div className="text-neutral-400 text-[9px]">[{idx}]</div>
              <div className={val >= 0 ? "text-emerald-700 font-semibold" : "text-blue-700 font-semibold"}>
                {val.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
