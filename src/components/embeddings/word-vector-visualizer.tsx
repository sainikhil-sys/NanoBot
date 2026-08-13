"use client";

import React, { useState, useEffect, useCallback } from "react";
import { EmbeddingInput } from "./embedding-input";
import { PipelineAnimation } from "./pipeline-animation";
import { VectorSpace } from "./vector-space";
import { VectorDisplay } from "./vector-display";
import { TokenPreview } from "./token-preview";
import { SimilarityPanel } from "./similarity-panel";
import {
  Sparkle,
  ChartPie,
  TreeStructure,
  Sliders,
  ArrowsLeftRight,
  Info,
} from "@phosphor-icons/react";

interface WordVectorVisualizerProps {
  initialText?: string;
}

export function WordVectorVisualizer({
  initialText = "artificial intelligence",
}: WordVectorVisualizerProps) {
  const [inputText, setInputText] = useState(initialText);
  const [activeTab, setActiveTab] = useState<"visualize" | "vector" | "tokens" | "similarity">(
    "visualize"
  );
  const [stage, setStage] = useState<"idle" | "tokenizing" | "embedding" | "projecting" | "complete" | "error">(
    "idle"
  );

  const [vectorData, setVectorData] = useState<number[]>([]);
  const [dimensions, setDimensions] = useState<number>(384);
  const [magnitude, setMagnitude] = useState<number>(0);
  const [modelName, setModelName] = useState<string>("NanoBot-Embedder");
  const [projectedPoints, setProjectedPoints] = useState<any[]>([]);

  const [compareText, setCompareText] = useState<string>("");
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEmbeddingData = useCallback(async (textToEmbed: string, compText?: string) => {
    if (!textToEmbed.trim()) {
      setVectorData([]);
      setStage("idle");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setStage("tokenizing");

    try {
      setTimeout(() => setStage("embedding"), 150);

      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToEmbed, compareText: compText }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate embedding vector");
      }

      const data = await res.json();
      setStage("projecting");

      setVectorData(data.vector || []);
      setDimensions(data.dimensions || data.vector?.length || 384);
      setMagnitude(data.magnitude || 0);
      setModelName(data.model || "NanoBot-Embedder");
      setProjectedPoints(data.projected2D || []);

      if (data.cosineSimilarity !== undefined) {
        setSimilarityScore(data.cosineSimilarity);
      }

      setTimeout(() => setStage("complete"), 200);
    } catch (err: any) {
      console.error("Error fetching embedding vector:", err);
      setErrorMsg(err.message || "Embedding generation failed.");
      setStage("error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmbeddingData(inputText, compareText);
  }, [fetchEmbeddingData, inputText]);

  const handleComparisonRequest = (comp: string) => {
    setCompareText(comp);
    fetchEmbeddingData(inputText, comp);
  };

  return (
    <div className="w-full space-y-6 font-sans text-neutral-900">
      {/* Header Banner */}
      <div className="rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EBEBEB] text-xs font-mono text-neutral-600 shadow-2xs">
              <Sparkle className="h-3.5 w-3.5 text-blue-600" />
              <span>Real-Time Embedding Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black font-sans">
              Word → Vector Studio
            </h2>
            <p className="text-sm text-neutral-500 font-sans max-w-xl leading-relaxed">
              Watch text transform into high-dimensional mathematical vector embeddings in real time.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl border border-[#EBEBEB] bg-white text-center shadow-2xs min-w-[120px]">
              <div className="text-[10px] font-mono text-neutral-400 uppercase">Dimensions</div>
              <div className="text-xl font-bold font-mono text-black">{dimensions}</div>
            </div>
            <div className="p-4 rounded-2xl border border-[#EBEBEB] bg-white text-center shadow-2xs min-w-[120px]">
              <div className="text-[10px] font-mono text-neutral-400 uppercase">Magnitude</div>
              <div className="text-xl font-bold font-mono text-black">{magnitude}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <EmbeddingInput value={inputText} onChange={setInputText} isLoading={isLoading} />

      {/* Step Pipeline Bar */}
      <PipelineAnimation stage={stage} />

      {errorMsg && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-sans">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-[#EBEBEB] gap-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab("visualize")}
          className={`pb-3 px-4 text-xs font-semibold font-sans flex items-center gap-1.5 transition-colors border-b-2 -mb-[1px] ${
            activeTab === "visualize"
              ? "border-black text-black font-bold"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <ChartPie className="h-4 w-4" />
          <span>Visualize (2D Space)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vector")}
          className={`pb-3 px-4 text-xs font-semibold font-sans flex items-center gap-1.5 transition-colors border-b-2 -mb-[1px] ${
            activeTab === "vector"
              ? "border-black text-black font-bold"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Raw Vector ({dimensions}D)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tokens")}
          className={`pb-3 px-4 text-xs font-semibold font-sans flex items-center gap-1.5 transition-colors border-b-2 -mb-[1px] ${
            activeTab === "tokens"
              ? "border-black text-black font-bold"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <TreeStructure className="h-4 w-4" />
          <span>Tokens</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("similarity")}
          className={`pb-3 px-4 text-xs font-semibold font-sans flex items-center gap-1.5 transition-colors border-b-2 -mb-[1px] ${
            activeTab === "similarity"
              ? "border-black text-black font-bold"
              : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          <ArrowsLeftRight className="h-4 w-4" />
          <span>Similarity Matrix</span>
        </button>
      </div>

      {/* Active Tab View */}
      <div className="pt-2">
        {activeTab === "visualize" && (
          <VectorSpace points={projectedPoints} inputText={inputText} />
        )}

        {activeTab === "vector" && (
          <VectorDisplay
            vector={vectorData}
            dimensions={dimensions}
            magnitude={magnitude}
            model={modelName}
          />
        )}

        {activeTab === "tokens" && <TokenPreview text={inputText} />}

        {activeTab === "similarity" && (
          <SimilarityPanel
            inputText={inputText}
            onCompare={handleComparisonRequest}
            similarity={similarityScore}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-neutral-500 flex items-center gap-3">
        <Info className="h-5 w-5 text-neutral-400 shrink-0" />
        <span>
          NanoBot uses these exact high-dimensional vector embeddings for RAG document indexing, semantic knowledge retrieval, and cosine similarity search.
        </span>
      </div>
    </div>
  );
}
