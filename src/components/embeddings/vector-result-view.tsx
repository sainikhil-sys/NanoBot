"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Copy,
  DownloadSimple,
  ArrowCounterClockwise,
  Eye,
  Database,
  Timer,
  Cpu,
  Hash,
  Stack,
  X,
  Check,
} from "@phosphor-icons/react";
import { VectorVisualizations } from "./vector-visualizations";

export interface VectorResultData {
  vectorId: string;
  dimensions: number;
  magnitude: number;
  model: string;
  vectorStore: string;
  chunksCount: number;
  processingTimeMs: number;
  vector: number[];
  chunks?: Array<{
    index: number;
    text: string;
    vector: number[];
    tokens: number;
  }>;
  sourceFilename?: string | null;
  inputText?: string;
}

interface VectorResultViewProps {
  result: VectorResultData;
  onReset: () => void;
}

export function VectorResultView({ result, onReset }: VectorResultViewProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedArray, setCopiedArray] = useState(false);
  const [showRawModal, setShowRawModal] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(result.vectorId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyArray = () => {
    navigator.clipboard.writeText(JSON.stringify(result.vector));
    setCopiedArray(true);
    setTimeout(() => setCopiedArray(false), 2000);
  };

  const handleDownload = () => {
    const exportData = {
      vectorId: result.vectorId,
      dimensions: result.dimensions,
      magnitude: result.magnitude,
      model: result.model,
      vectorStore: result.vectorStore,
      chunksCount: result.chunksCount,
      processingTimeMs: result.processingTimeMs,
      sourceFilename: result.sourceFilename || null,
      inputText: result.inputText || "",
      vector: result.vector,
      chunks: result.chunks || [],
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nanobot-vector-${result.vectorId.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Result Status Hero Banner */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF7EE] border border-[#16A34A]/20 text-xs font-mono text-[#16A34A] shadow-2xs">
              <CheckCircle weight="fill" className="h-4 w-4" />
              <span>Vector Generated Successfully</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black font-sans">
              High-Dimensional Embedding Vector
            </h2>
            <p className="text-sm text-[#6B7280] font-sans max-w-xl leading-relaxed">
              {result.sourceFilename
                ? `Extracted from document "${result.sourceFilename}" into ${result.chunksCount} chunks.`
                : `Transformed input prompt into a normalized ${result.dimensions}D mathematical vector tensor.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center transition-all duration-200 h-9 px-4 rounded-full border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-medium text-black gap-1.5 shadow-2xs"
            >
              <ArrowCounterClockwise weight="bold" className="h-3.5 w-3.5" />
              <span>Process Another</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metadata Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] font-mono text-[11px] uppercase">
            <span>Dimensions</span>
            <Hash className="h-4 w-4 text-black" />
          </div>
          <div className="text-2xl font-bold font-mono text-black">{result.dimensions}</div>
          <div className="text-[10px] font-mono text-[#6B7280]">Float32 coordinates</div>
        </div>

        <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] font-mono text-[11px] uppercase">
            <span>Semantic Chunks</span>
            <Stack className="h-4 w-4 text-black" />
          </div>
          <div className="text-2xl font-bold font-mono text-black">{result.chunksCount}</div>
          <div className="text-[10px] font-mono text-[#6B7280]">Partitioned segments</div>
        </div>

        <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] font-mono text-[11px] uppercase">
            <span>Processing Time</span>
            <Timer className="h-4 w-4 text-black" />
          </div>
          <div className="text-2xl font-bold font-mono text-black">
            {result.processingTimeMs} <span className="text-xs font-normal text-[#6B7280]">ms</span>
          </div>
          <div className="text-[10px] font-mono text-[#6B7280]">End-to-end execution</div>
        </div>

        <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-1">
          <div className="flex items-center justify-between text-[#6B7280] font-mono text-[11px] uppercase">
            <span>Vector Magnitude</span>
            <Cpu className="h-4 w-4 text-black" />
          </div>
          <div className="text-2xl font-bold font-mono text-black">{result.magnitude.toFixed(3)}</div>
          <div className="text-[10px] font-mono text-[#6B7280]">Normalized ||v|| norm</div>
        </div>
      </div>

      {/* Vector Details & Action Toolbar */}
      <div className="p-6 rounded-2xl border border-[#E5E7EB] bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase text-[#6B7280]">Persisted Record Details</div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-black font-mono">{result.vectorId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded hover:bg-neutral-100 text-[#6B7280] hover:text-black transition-colors"
                title="Copy Vector ID"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRawModal(true)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-medium text-black transition-colors shadow-2xs"
            >
              <Eye weight="bold" className="h-3.5 w-3.5" />
              <span>Inspect Raw Vector</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs transition-colors"
            >
              <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-[#6B7280]">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-black shrink-0" />
            <span>
              <strong className="text-black">Vector Store:</strong> {result.vectorStore}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-black shrink-0" />
            <span>
              <strong className="text-black">Model:</strong> {result.model}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visualizations */}
      <VectorVisualizations
        vector={result.vector}
        chunks={result.chunks}
        dimensions={result.dimensions}
        magnitude={result.magnitude}
        inputText={result.inputText}
      />

      {/* Raw Vector Float Modal */}
      {showRawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn"
          style={{ background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)" }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="text-base font-bold text-black font-sans">
                Raw Embedding Tensor ({result.dimensions} Float32 Values)
              </h3>
              <button
                type="button"
                onClick={() => setShowRawModal(false)}
                className="p-1.5 rounded-lg text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] font-mono text-xs text-[#1F2937] leading-relaxed break-all space-y-2">
              <div className="text-[11px] text-[#6B7280]">
                Array of {result.vector.length} IEEE 754 floating-point coordinates:
              </div>
              <div>[{result.vector.join(", ")}]</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#6B7280] font-mono">
                Length: {result.vector.length} floats
              </span>
              <button
                type="button"
                onClick={handleCopyArray}
                className="px-4 py-2 rounded-xl bg-black text-white text-xs font-medium font-sans hover:bg-[#1A1A1A] transition-colors flex items-center gap-1.5"
              >
                {copiedArray ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : null}
                <span>{copiedArray ? "Copied to Clipboard!" : "Copy Raw Array"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
