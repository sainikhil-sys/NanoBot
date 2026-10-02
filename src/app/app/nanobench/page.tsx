"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { ChartBar, WarningCircle, CheckCircle, XCircle } from "@phosphor-icons/react";

export default function NanoBenchPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/lab/nanobench", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Benchmark failed");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header title="NanoBench" description="Evaluation on real executions only. Every number here is measured by running the actual services now — nothing is fabricated." />
      <main className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
        <button type="button" onClick={run} disabled={loading} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold disabled:opacity-50">
          <ChartBar weight="bold" className="h-4 w-4 text-[#16A34A]" /> {loading ? "Measuring..." : "Run benchmark"}
        </button>

        {error && <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700"><WarningCircle weight="bold" className="h-4 w-4" />{error}</div>}

        {!result && !loading && (
          <div className="p-12 text-center border border-dashed border-[#E5E7EB] rounded-2xl bg-[#FAFAFA] text-xs text-[#6B7280]">
            Run the benchmark to produce live measurements of tokenization, embedding, and similarity.
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <p className="text-[11px] font-mono text-[#9CA3AF]">{result.note} · {new Date(result.measuredAt).toLocaleString()}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-1">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">Tokenization</div>
                <div className="text-2xl font-mono font-bold text-black">{result.tokenization.avgLatencyMs}ms</div>
                <div className="text-[11px] font-mono text-[#9CA3AF]">{result.tokenization.throughputPerSec}/s · {result.tokenization.tokensPerSample} tokens/sample · n={result.tokenization.iterations}</div>
              </div>
              <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-1">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">Embedding</div>
                <div className="text-2xl font-mono font-bold text-black">{result.embedding.latencyMs}ms</div>
                <div className="text-[11px] font-mono text-[#9CA3AF]">{result.embedding.dimensions} dims · {result.embedding.model}</div>
              </div>
              <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-1">
                <div className="text-[11px] font-mono uppercase text-[#6B7280]">Similarity check</div>
                <div className="flex items-center gap-2 text-sm font-mono text-black">
                  {result.similarity.discriminates ? <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" /> : <XCircle weight="fill" className="h-4 w-4 text-red-500" />}
                  <span>{result.similarity.discriminates ? "discriminates" : "inconclusive"}</span>
                </div>
                <div className="text-[11px] font-mono text-[#9CA3AF]">related {result.similarity.relatedPair} vs unrelated {result.similarity.unrelatedPair}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
