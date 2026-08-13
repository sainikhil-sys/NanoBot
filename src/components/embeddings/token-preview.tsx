"use client";

import React from "react";
import { TreeStructure } from "@phosphor-icons/react";

interface TokenPreviewProps {
  text: string;
}

export function TokenPreview({ text }: TokenPreviewProps) {
  if (!text || !text.trim()) {
    return (
      <div className="p-8 text-center text-xs text-neutral-400 font-sans border border-dashed border-[#EBEBEB] rounded-2xl">
        Enter text to view tokenization preview...
      </div>
    );
  }

  // Token breakdown
  const words = text.trim().split(/(\s+|[^\w\s])/).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA]">
        <div>
          <h4 className="text-xs font-semibold text-black font-sans flex items-center gap-1.5">
            <TreeStructure className="h-4 w-4 text-neutral-600" />
            <span>Tokenization Breakdown Preview</span>
          </h4>
          <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
            Text tokenized into {words.length} discrete semantic sub-word units
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-black text-white font-mono text-[10px]">
          {words.length} Tokens
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        {words.map((token, idx) => {
          const isSpace = /^\s+$/.test(token);
          if (isSpace) return null;

          return (
            <div
              key={idx}
              className="p-3 rounded-2xl border border-[#EBEBEB] bg-white hover:border-black transition-all shadow-2xs group flex flex-col justify-between min-w-[80px]"
            >
              <div className="text-[9px] font-mono text-neutral-400">Token [{idx}]</div>
              <div className="text-[14px] font-mono font-bold text-black my-1 group-hover:text-blue-600 transition-colors">
                "{token}"
              </div>
              <div className="text-[9px] font-mono text-neutral-500">
                {token.length} chars
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
