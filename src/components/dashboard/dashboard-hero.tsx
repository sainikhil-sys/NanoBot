"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Paperclip,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";

export function DashboardHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [webSearchActive, setWebSearchActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const encoded = encodeURIComponent(query.trim());
    const webParam = webSearchActive ? "&web=true" : "";
    router.push(`/app/conversations?q=${encoded}${webParam}`);
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 pt-2 pb-4 max-w-4xl mx-auto w-full">
      {/* Small Status Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-xs font-mono text-[#6B7280] shadow-2xs">
        <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
        <span className="font-semibold text-black">AI Search Ready</span>
      </div>

      {/* Main Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black font-sans">
          Search Smarter with <span className="text-[#16A34A]">Nanobot</span>
        </h1>
        <p className="text-sm sm:text-base text-[#6B7280] font-sans max-w-2xl mx-auto leading-relaxed">
          Get real-time answers, upload files, convert documents, and automate with AI.
        </p>
      </div>

      {/* Large Unified Search/Chat Input */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm hover:border-black/30 focus-within:border-black transition-all space-y-3 text-left"
      >
        <textarea
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask anything or search the web..."
          className="w-full px-3 pt-2 text-[14px] font-sans text-black placeholder:text-[#6B7280] bg-transparent border-0 focus:outline-none resize-none leading-relaxed"
        />

        {/* Input Bar Controls */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB] px-1">
          <div className="flex items-center gap-2">
            {/* Web Search Toggle Badge */}
            <button
              type="button"
              onClick={() => setWebSearchActive(!webSearchActive)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                webSearchActive
                  ? "bg-[#EAF7EE] text-[#16A34A] border border-[#16A34A]/20 font-semibold"
                  : "bg-neutral-100 text-[#6B7280] hover:text-black"
              }`}
            >
              <Globe weight="bold" className="h-3.5 w-3.5" />
              <span>Web Search {webSearchActive ? "ON" : "OFF"}</span>
            </button>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => router.push("/app/upload")}
              className="p-1.5 rounded-xl text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors"
              title="Attach document or image"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Word to Vector Shortcut */}
            <button
              type="button"
              onClick={() => router.push("/app/embeddings")}
              className="p-1.5 rounded-xl text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors hidden sm:block"
              title="Word to Vector Studio"
            >
              <Sparkle className="h-4 w-4" />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="h-9 w-9 rounded-full bg-black text-white hover:bg-[#1A1A1A] flex items-center justify-center transition-all disabled:opacity-40 shadow-xs shrink-0"
            title="Send query"
          >
            <ArrowRight weight="bold" className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
