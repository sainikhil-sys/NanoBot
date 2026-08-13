"use client";

import React, { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { FileUploader } from "./file-uploader";
import { AgentExecutionOverlay, AgentExecutionState } from "./agent-execution-overlay";
import { VectorResultView, VectorResultData } from "./vector-result-view";
import { Sparkle, ArrowRight, Lightbulb } from "@phosphor-icons/react";

const INITIAL_STEPS = [
  { id: "input_received", label: "Input received & validated", state: "pending" as const },
  { id: "text_extraction", label: "Text extracted from content", state: "pending" as const },
  { id: "text_cleaning", label: "Text cleaned & normalized", state: "pending" as const },
  { id: "chunking", label: "Text partitioned into semantic chunks", state: "pending" as const },
  { id: "embedding", label: "Generating vector embeddings", state: "pending" as const },
  { id: "vector_storage", label: "Storing vectors in database", state: "pending" as const },
];

export function WordToVectorPage() {
  const [inputText, setInputText] = useState("Explain the architecture of multi-agent neural networks with high-dimensional vector embeddings.");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Live Agent Execution State
  const [executionState, setExecutionState] = useState<AgentExecutionState>({
    isActive: false,
    isCompleted: false,
    error: null,
    progress: 0,
    currentStepId: "input_received",
    steps: INITIAL_STEPS,
    metadata: {
      model: "openai/text-embedding-3-small",
      chunksCount: 1,
      dimensions: 1536,
    },
  });

  // Vector Result State
  const [resultData, setResultData] = useState<VectorResultData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up in-flight requests if user navigates away
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const startVectorGeneration = async () => {
    setValidationError(null);
    if (!inputText.trim() && !selectedFile) {
      setValidationError("Please provide text input or select a document file.");
      return;
    }

    // Initialize Execution Overlay
    setExecutionState({
      isActive: true,
      isCompleted: false,
      error: null,
      progress: 5,
      currentStepId: "input_received",
      steps: INITIAL_STEPS.map((s) => ({ ...s, state: "pending" as const, submessage: null })),
      metadata: {
        model: "openai/text-embedding-3-small",
        chunksCount: 1,
        dimensions: 1536,
        filename: selectedFile?.name || null,
      },
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let response: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        if (inputText.trim()) {
          formData.append("text", inputText.trim());
        }
        response = await fetch("/api/embeddings/stream", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });
      } else {
        response = await fetch("/api/embeddings/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: inputText.trim() }),
          signal: abortController.signal,
        });
      }

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              handleLiveServerEvent(event);
            } catch (parseErr) {
              console.warn("Could not parse SSE event:", jsonStr, parseErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Vector generation aborted by user.");
        return;
      }
      console.error("Vector generation stream error:", err);
      setExecutionState((prev) => ({
        ...prev,
        error: {
          step: prev.currentStepId,
          message: err.message || "Connection failed during vector generation.",
        },
      }));
    }
  };

  const handleLiveServerEvent = (event: any) => {
    if (event.type === "agent_step") {
      setExecutionState((prev) => {
        const updatedSteps = prev.steps.map((s) => {
          if (s.id === event.step) {
            return {
              ...s,
              state: event.status === "complete" ? ("complete" as const) : ("running" as const),
              submessage: event.message,
            };
          }
          const stepOrder = ["input_received", "text_extraction", "text_cleaning", "chunking", "embedding", "vector_storage"];
          const currentIdx = stepOrder.indexOf(event.step);
          const sIdx = stepOrder.indexOf(s.id);
          if (sIdx < currentIdx && s.state !== "complete") {
            return { ...s, state: "complete" as const };
          }
          return s;
        });

        return {
          ...prev,
          progress: event.progress || prev.progress,
          currentStepId: event.step,
          steps: updatedSteps,
          metadata: {
            ...prev.metadata,
            model: event.metadata?.model || prev.metadata.model,
            chunksCount: event.metadata?.chunksCount || prev.metadata.chunksCount,
            dimensions: event.metadata?.dimensions || prev.metadata.dimensions,
          },
        };
      });
    } else if (event.type === "complete") {
      setExecutionState((prev) => ({
        ...prev,
        isActive: false,
        isCompleted: true,
        progress: 100,
        steps: prev.steps.map((s) => ({ ...s, state: "complete" as const })),
      }));

      setResultData({
        vectorId: event.vectorId,
        dimensions: event.dimensions,
        magnitude: event.magnitude,
        model: event.model,
        vectorStore: event.vectorStore,
        chunksCount: event.chunksCount,
        processingTimeMs: event.processingTimeMs,
        vector: event.vector,
        chunks: event.chunks || [],
        sourceFilename: event.sourceFilename || null,
        inputText: event.inputText || inputText,
      });
    } else if (event.type === "error") {
      setExecutionState((prev) => ({
        ...prev,
        error: {
          step: event.step || prev.currentStepId,
          message: event.message,
        },
      }));
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setExecutionState((prev) => ({
      ...prev,
      isActive: false,
      error: null,
    }));
  };

  const handleReset = () => {
    setResultData(null);
    setValidationError(null);
    setExecutionState({
      isActive: false,
      isCompleted: false,
      error: null,
      progress: 0,
      currentStepId: "input_received",
      steps: INITIAL_STEPS,
      metadata: {
        model: "openai/text-embedding-3-small",
        chunksCount: 1,
        dimensions: 1536,
      },
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900">
      <Header
        title="Word to Vector"
        description="Convert text and documents into high-dimensional vector embeddings with live agent execution"
      />

      <main className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex-1 space-y-8">
        {/* Transparent Live Agent Overlay */}
        <AgentExecutionOverlay
          state={executionState}
          onCancel={handleCancel}
          onRetry={startVectorGeneration}
        />

        {/* If Vector Result is Available, Show Result View */}
        {resultData ? (
          <VectorResultView result={resultData} onReset={handleReset} />
        ) : (
          /* Input Studio View */
          <div className="space-y-6 animate-fadeIn">
            {/* Top Banner */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-8 shadow-xs relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono text-[#6B7280] shadow-2xs">
                    <Sparkle weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Neural Vector Synthesis Engine</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black font-sans">
                    Word to Vector
                  </h2>
                  <p className="text-sm text-[#6B7280] font-sans max-w-xl leading-relaxed">
                    Convert text and documents into vector embeddings. Watch NanoBot execute extraction, semantic chunking, and tensor generation in real time.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Card */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-sans">
                  {validationError}
                </div>
              )}

              {/* Text Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-black font-sans flex items-center justify-between">
                  <span>Enter Text or Prompt</span>
                  <span className="text-[11px] font-mono text-[#6B7280] font-normal">
                    {inputText.length} characters
                  </span>
                </label>
                <textarea
                  rows={5}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Paste text, questions, code, or article content to convert into vector coordinates..."
                  className="w-full p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[13px] font-sans text-black placeholder:text-[#6B7280] focus:bg-white focus:outline-none focus:border-black transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Drag and Drop File Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-black font-sans">
                  Or Upload Document (PDF, DOCX, TXT, MD)
                </label>
                <FileUploader
                  selectedFile={selectedFile}
                  onFileSelect={(file) => {
                    setSelectedFile(file);
                    if (validationError) setValidationError(null);
                  }}
                />
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                <div className="flex items-center gap-2 text-xs text-[#6B7280] font-sans">
                  <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>
                    Generates normalized mathematical coordinates for semantic search & RAG.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={startVectorGeneration}
                  className="inline-flex items-center justify-center transition-all duration-200 h-10 px-6 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-2"
                >
                  <span>Generate Vector</span>
                  <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
