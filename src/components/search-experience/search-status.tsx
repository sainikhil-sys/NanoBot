"use client";

import React from "react";
import { Broadcast, CheckCircle } from "@phosphor-icons/react";

interface SearchStatusProps {
  status: "idle" | "typing" | "understanding" | "searching" | "synthesizing" | "complete";
  sourcesSearched: number;
  resultsCount: number;
}

export function SearchStatus({
  status,
  sourcesSearched,
  resultsCount,
}: SearchStatusProps) {
  return (
    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 max-w-[600px] mx-auto px-2 py-1">
      {/* Left: Activity Phase */}
      <div className="flex items-center gap-1.5">
        {status === "complete" ? (
          <>
            <CheckCircle weight="fill" className="h-3 w-3 text-[#22C55E]" />
            <span className="text-neutral-700 font-medium">Search Complete</span>
          </>
        ) : status === "searching" || status === "understanding" ? (
          <>
            <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="text-neutral-700">
              {status === "understanding"
                ? "Understanding query topology..."
                : `Searching ${sourcesSearched.toLocaleString()} sources...`}
            </span>
          </>
        ) : status === "synthesizing" ? (
          <>
            <span className="h-2 w-2 rounded-full bg-[#A3FF6F] animate-pulse" />
            <span className="text-neutral-700">Synthesizing verified answer...</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
            <span>Ready</span>
          </>
        )}
      </div>

      {/* Right: Results count */}
      {status === "complete" && (
        <div className="text-neutral-500">
          Found <span className="font-semibold text-black">{resultsCount}</span> sources • Top AI matches
        </div>
      )}
    </div>
  );
}
