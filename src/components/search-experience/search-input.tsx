"use client";

import React, { useState } from "react";
import {
  MagnifyingGlass,
  Microphone,
  ClockCounterClockwise,
  X,
  Sparkle,
} from "@phosphor-icons/react";
import { RECENT_SEARCHES, SEARCH_COMMANDS } from "./search-demo-data";

interface SearchInputProps {
  typedQuery: string;
  isTyping: boolean;
  isSearching: boolean;
  onSelectQuery: (query: string) => void;
  onClear: () => void;
}

export function SearchInput({
  typedQuery,
  isTyping,
  isSearching,
  onSelectQuery,
  onClear,
}: SearchInputProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);

  const handleVoiceToggle = () => {
    setIsListeningVoice(true);
    setTimeout(() => {
      setIsListeningVoice(false);
      onSelectQuery("Find the best architecture for a multi-agent AI application");
    }, 2400);
  };

  return (
    <div className="relative max-w-[620px] mx-auto z-20">
      {/* Main Search Bar */}
      <div className="w-full bg-white rounded-full border border-[#E5E5E5] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-2xs transition-all focus-within:border-black">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <MagnifyingGlass
            weight="bold"
            className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
              isSearching ? "scale-110 text-black" : ""
            }`}
          />

          <div className="text-[13px] sm:text-[14px] font-sans text-black truncate flex items-center flex-1">
            {isListeningVoice ? (
              <span className="text-[#3B82F6] font-mono text-xs flex items-center gap-1.5 animate-pulse">
                <span>Listening for query</span>
                <span className="inline-flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                  <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                  <span className="w-1 h-1 rounded-full bg-[#3B82F6]" />
                </span>
              </span>
            ) : (
              <>
                <span>{typedQuery}</span>
                {isTyping && (
                  <span className="animate-cursor-blink text-black font-normal ml-0.5 text-[15px]">
                    |
                  </span>
                )}
                {!isTyping && !typedQuery && (
                  <span className="text-neutral-400 text-[13px]">
                    Ask anything, search codebase, or debug an error...
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {typedQuery && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Voice Search Mic Button */}
          <button
            type="button"
            onClick={handleVoiceToggle}
            className={`p-1.5 rounded-full transition-colors ${
              isListeningVoice
                ? "bg-blue-50 text-[#3B82F6] ring-1 ring-blue-300"
                : "text-neutral-400 hover:text-black hover:bg-neutral-100"
            }`}
            title="Voice Search (AI Voice Input)"
          >
            <Microphone weight={isListeningVoice ? "fill" : "regular"} className="h-4 w-4" />
          </button>

          {/* Search History Dropdown Button */}
          <button
            type="button"
            onClick={() => setHistoryOpen(!historyOpen)}
            className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors"
            title="Recent Searches"
          >
            <ClockCounterClockwise className="h-4 w-4" />
          </button>

          {/* Enter Shortcut Pill */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded border border-[#EBEBEB] bg-[#FAFAFA] text-[10px] font-mono text-neutral-400">
            <span>↵</span>
            <span>Enter</span>
          </div>
        </div>
      </div>

      {/* Recent Searches Popover */}
      {historyOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-[#EAEAEA] rounded-2xl p-4 shadow-lg z-30 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0F0F0]">
            <span className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">
              Recent Searches
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="text-neutral-400 hover:text-black text-xs"
            >
              Close
            </button>
          </div>
          <div className="space-y-1">
            {RECENT_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onSelectQuery(item);
                  setHistoryOpen(false);
                }}
                className="w-full text-left p-2 rounded-xl text-xs font-sans text-neutral-700 hover:bg-[#FAFAFA] hover:text-black flex items-center justify-between transition-colors"
              >
                <span className="truncate">{item}</span>
                <Sparkle className="h-3 w-3 text-neutral-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
