"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { Brain, WarningCircle } from "@phosphor-icons/react";

export default function NlpLabPage() {
  const [text, setText] = useState("NanoBot shipped a great release on 2026-10-03. Contact team@nanobot.ai for the excellent new workflow engine. It fixed a terrible bug.");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/lab/nlp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header title="NLP Lab" description="Make NLP concepts visible: tokenization, sentiment, entities and readability — all computed transparently." />
      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="space-y-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
            className="w-full rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-sm text-black focus:outline-none focus:border-black" />
          <button type="button" onClick={run} disabled={loading || !text.trim()}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold disabled:opacity-50">
            <Brain weight="bold" className="h-4 w-4 text-[#16A34A]" /> {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {error && <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700"><WarningCircle weight="bold" className="h-4 w-4" />{error}</div>}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black">Tokenization</h3>
                <span className="text-[11px] font-mono text-[#6B7280]">{result.tokenization.totalTokens} tokens · {result.tokenization.latencyMs}ms</span>
              </div>
              <p className="text-[10px] font-mono text-[#9CA3AF]">{result.tokenization.tokenizerType}</p>
              <div className="flex flex-wrap gap-1.5">
                {result.tokenization.tokens.slice(0, 80).map((t: any) => (
                  <span key={t.index} title={"id " + t.tokenId} className="px-1.5 py-0.5 rounded bg-[#FAFAFA] border border-[#E5E7EB] text-[11px] font-mono text-black whitespace-pre">{t.text}</span>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-2">
              <h3 className="text-sm font-bold text-black">Sentiment</h3>
              <p className="text-[10px] font-mono text-[#9CA3AF]">{result.sentiment.method}</p>
              <div className="flex items-center gap-2">
                <span className={"px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold " + (result.sentiment.label === "positive" ? "bg-green-50 text-[#16A34A] border border-green-200" : result.sentiment.label === "negative" ? "bg-red-50 text-red-600 border border-red-200" : "bg-neutral-100 text-[#6B7280] border border-[#E5E7EB]")}>{result.sentiment.label}</span>
                <span className="text-xs font-mono text-[#6B7280]">score {result.sentiment.score}</span>
              </div>
              <div className="text-[11px] font-mono text-[#6B7280]">+ {result.sentiment.positiveHits.join(", ") || "—"}</div>
              <div className="text-[11px] font-mono text-[#6B7280]">- {result.sentiment.negativeHits.join(", ") || "—"}</div>
            </div>

            <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-2">
              <h3 className="text-sm font-bold text-black">Entities</h3>
              <p className="text-[10px] font-mono text-[#9CA3AF]">{result.entities.method}</p>
              <div className="flex flex-wrap gap-1.5">
                {result.entities.entities.length === 0 ? <span className="text-xs text-[#9CA3AF]">No entities detected</span> :
                  result.entities.entities.map((e: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-[#FAFAFA] border border-[#E5E7EB] text-[11px] font-mono"><span className="text-[#9CA3AF]">{e.type}</span> {e.value}</span>
                  ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-2">
              <h3 className="text-sm font-bold text-black">Readability</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#374151]">
                <div>Words: <span className="font-bold">{result.readability.words}</span></div>
                <div>Sentences: <span className="font-bold">{result.readability.sentences}</span></div>
                <div>Syllables: <span className="font-bold">{result.readability.syllables}</span></div>
                <div>Avg words/sentence: <span className="font-bold">{result.readability.avgWordsPerSentence}</span></div>
                <div className="col-span-2">Flesch reading ease: <span className="font-bold">{result.readability.fleschReadingEase}</span></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
