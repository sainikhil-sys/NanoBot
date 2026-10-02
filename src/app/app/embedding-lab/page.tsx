"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { Pulse, WarningCircle } from "@phosphor-icons/react";

export default function EmbeddingLabPage() {
  const [text, setText] = useState("How do I reset my password?");
  const [compareTo, setCompareTo] = useState("What is the process to recover my account login?");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/lab/embedding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, compareTo }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Embedding failed");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  const maxAbs = result ? Math.max(...result.embedding.preview.map((v: number) => Math.abs(v)), 0.0001) : 1;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header title="Embedding Lab" description="Turn text into vectors: dimension, magnitude, a preview of the vector, and cosine similarity between two texts." />
      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-black">Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 text-sm text-black focus:outline-none focus:border-black" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-black">Compare to (optional)</label>
            <textarea value={compareTo} onChange={(e) => setCompareTo(e.target.value)} rows={3} className="w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-3 text-sm text-black focus:outline-none focus:border-black" />
          </div>
        </div>
        <button type="button" onClick={run} disabled={loading || !text.trim()} className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold disabled:opacity-50">
          <Pulse weight="bold" className="h-4 w-4 text-[#16A34A]" /> {loading ? "Embedding..." : "Embed"}
        </button>

        {error && <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700"><WarningCircle weight="bold" className="h-4 w-4" />{error}</div>}

        {result && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#374151]">
                <div>Dimensions: <span className="font-bold">{result.embedding.dimensions}</span></div>
                <div>Magnitude: <span className="font-bold">{result.embedding.magnitude}</span></div>
                <div>Model: <span className="font-bold">{result.embedding.model}</span></div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-[#9CA3AF] mb-1">Vector preview (first 16 dims)</div>
                <div className="flex items-end gap-1 h-20">
                  {result.embedding.preview.map((v: number, i: number) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center" title={String(v)}>
                      <div className={"w-full rounded-t " + (v >= 0 ? "bg-[#16A34A]" : "bg-red-400")} style={{ height: (Math.abs(v) / maxAbs) * 100 + "%" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.similarity && (
              <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-2">
                <h3 className="text-sm font-bold text-black">Cosine similarity</h3>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold text-black">{result.similarity.similarity}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#FAFAFA] border border-[#E5E7EB] text-[#374151]">{result.similarity.rating}</span>
                  <span className="text-[11px] font-mono text-[#9CA3AF]">{result.similarity.latencyMs}ms</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F0F0F0] overflow-hidden">
                  <div className="h-full bg-black" style={{ width: Math.max(0, Math.min(100, result.similarity.similarity * 100)) + "%" }} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
