"use client";

import React, { useState } from "react";
import {
  ChartBar,
  GridFour,
  TreeStructure,
  Sparkle,
} from "@phosphor-icons/react";

interface ChunkData {
  index: number;
  text: string;
  vector: number[];
  tokens: number;
}

interface VectorVisualizationsProps {
  vector: number[];
  dimensions: number;
  magnitude: number;
  chunks?: ChunkData[];
  inputText?: string;
}

export function VectorVisualizations({
  vector,
  dimensions,
  magnitude,
  chunks = [],
  inputText = "",
}: VectorVisualizationsProps) {
  const [activeTab, setActiveTab] = useState<"waveform" | "grid" | "chunks">("waveform");
  const [hoveredDim, setHoveredDim] = useState<{ index: number; value: number } | null>(null);

  // Sample vector dimensions for waveform display (up to 128 bars)
  const sampleCount = Math.min(vector.length, 128);
  const step = Math.max(1, Math.floor(vector.length / sampleCount));
  const sampledValues = [];
  for (let i = 0; i < vector.length && sampledValues.length < sampleCount; i += step) {
    sampledValues.push({ index: i, value: vector[i] });
  }

  // Find min/max values for scaling
  const maxAbsValue = Math.max(
    0.001,
    ...vector.map((v) => Math.abs(v))
  );

  return (
    <div className="space-y-4">
      {/* Visualization Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#EBEBEB] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("waveform")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-1.5 transition-colors ${
              activeTab === "waveform"
                ? "bg-black text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <ChartBar className="h-3.5 w-3.5" />
            <span>Waveform Distribution</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("grid")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-1.5 transition-colors ${
              activeTab === "grid"
                ? "bg-black text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <GridFour className="h-3.5 w-3.5" />
            <span>Dimensional Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chunks")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium font-sans flex items-center gap-1.5 transition-colors ${
              activeTab === "chunks"
                ? "bg-black text-white shadow-2xs"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <TreeStructure className="h-3.5 w-3.5" />
            <span>Chunk-to-Vector Mapping</span>
          </button>
        </div>

        {hoveredDim && (
          <div className="text-[11px] font-mono text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-lg">
            Dim <span className="font-bold text-black">#{hoveredDim.index}</span>:{" "}
            <span className="font-bold text-[#059669]">{hoveredDim.value.toFixed(6)}</span>
          </div>
        )}
      </div>

      {/* Tab 1: Waveform Distribution */}
      {activeTab === "waveform" && (
        <div className="p-6 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-black font-sans">
                Vector Dimension Amplitudes
              </h4>
              <p className="text-[11px] font-mono text-neutral-400">
                Visualizing {dimensions} mathematical float coordinates normalized on unit sphere (||v|| = {magnitude})
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-white border border-[#EBEBEB] px-2 py-0.5 rounded-full text-neutral-500">
              Sampled 128 Dims
            </span>
          </div>

          <div className="h-40 w-full flex items-center justify-between gap-[2px] pt-4 px-2 bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
            {sampledValues.map((item) => {
              const heightPercent = Math.min(100, Math.max(8, (Math.abs(item.value) / maxAbsValue) * 100));
              const isPositive = item.value >= 0;

              return (
                <div
                  key={item.index}
                  onMouseEnter={() => setHoveredDim(item)}
                  onMouseLeave={() => setHoveredDim(null)}
                  className="flex-1 flex flex-col justify-center items-center h-full group relative cursor-pointer"
                >
                  <div
                    className={`w-full rounded-full transition-all duration-150 ${
                      isPositive
                        ? "bg-[#059669] group-hover:bg-emerald-400"
                        : "bg-neutral-700 group-hover:bg-black"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
            <span>Dimension #0</span>
            <span>Dimension #{Math.round(dimensions / 2)}</span>
            <span>Dimension #{dimensions - 1}</span>
          </div>
        </div>
      )}

      {/* Tab 2: Dimensional Heatmap Grid */}
      {activeTab === "grid" && (
        <div className="p-6 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-black font-sans">
                Dense Vector Grid Heatmap
              </h4>
              <p className="text-[11px] font-mono text-neutral-400">
                Hover over individual cells to inspect exact floating-point tensor values
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-neutral-800" /> Negative
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-emerald-500" /> Positive
              </span>
            </div>
          </div>

          <div className="grid grid-cols-16 sm:grid-cols-24 md:grid-cols-32 gap-1 p-3 bg-white rounded-2xl border border-[#EBEBEB] max-h-56 overflow-y-auto">
            {vector.slice(0, 384).map((val, idx) => {
              const intensity = Math.min(1, Math.abs(val) / maxAbsValue);
              const isPositive = val >= 0;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredDim({ index: idx, value: val })}
                  onMouseLeave={() => setHoveredDim(null)}
                  className="aspect-square rounded-[3px] transition-transform hover:scale-125 cursor-pointer shadow-2xs"
                  style={{
                    backgroundColor: isPositive
                      ? `rgba(5, 150, 105, ${Math.max(0.15, intensity)})`
                      : `rgba(23, 23, 23, ${Math.max(0.15, intensity)})`,
                  }}
                  title={`Dim #${idx}: ${val.toFixed(6)}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Chunk-to-Vector Mapping */}
      {activeTab === "chunks" && (
        <div className="p-6 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] space-y-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-black font-sans">
              Document Partition & Chunk Vectors
            </h4>
            <p className="text-[11px] font-mono text-neutral-400">
              Granular semantic embedding vectors generated per partitioned chunk
            </p>
          </div>

          {chunks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#EBEBEB] text-xs text-neutral-400 font-sans">
              Single continuous vector embedding generated.
            </div>
          ) : (
            <div className="space-y-3">
              {chunks.map((c) => (
                <div
                  key={c.index}
                  className="p-4 rounded-2xl bg-white border border-[#EBEBEB] shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-black text-white font-mono text-[10px] font-bold">
                        Chunk #{c.index}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-400">
                        ~{c.tokens} tokens · {c.text.length} chars
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {c.vector?.length || dimensions}D Vector
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 font-sans bg-[#FAFAFA] p-2.5 rounded-xl border border-neutral-100 line-clamp-2">
                    &ldquo;{c.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
