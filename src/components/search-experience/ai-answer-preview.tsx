"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkle, ArrowRight, BookOpen } from "@phosphor-icons/react";

interface Citation {
  number: number;
  name: string;
  resultId: string;
}

interface AIAnswerPreviewProps {
  summary: string;
  sourcesCount: number;
  citations: Citation[];
  onHoverCitation: (resultId: string | null) => void;
}

export function AIAnswerPreview({
  summary,
  sourcesCount,
  citations,
  onHoverCitation,
}: AIAnswerPreviewProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      if (index <= summary.length) {
        setDisplayedText(summary.slice(0, index));
        index += 3;
      } else {
        setDisplayedText(summary);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [summary]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-[#EAEAEA] bg-white p-5 sm:p-6 shadow-2xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-black text-white flex items-center justify-center shadow-xs">
            <Sparkle weight="bold" className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-[14px] font-semibold text-black font-sans">
            NanoBot Synthesized Answer
          </h3>
        </div>

        <span className="text-[11px] font-mono text-neutral-400">
          Based on {sourcesCount} verified sources
        </span>
      </div>

      {/* Answer text */}
      <p className="text-[13px] text-neutral-700 font-sans leading-relaxed">
        {displayedText}
        {displayedText.length < summary.length && (
          <span className="animate-pulse font-bold text-black ml-0.5">▍</span>
        )}
      </p>

      {/* Citations & Source Badges */}
      <div className="pt-3 border-t border-[#F5F5F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">
            Sources:
          </span>
          {citations.map((c) => (
            <button
              key={c.number}
              type="button"
              onMouseEnter={() => onHoverCitation(c.resultId)}
              onMouseLeave={() => onHoverCitation(null)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#EAEAEA] bg-[#FAFAFA] text-[11px] font-mono text-neutral-700 hover:border-black hover:bg-white hover:text-black transition-colors"
            >
              <span className="text-neutral-400 font-semibold">[{c.number}]</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-neutral-500 hover:text-black transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>View sources</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-black hover:underline"
          >
            <span>Expand answer</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
