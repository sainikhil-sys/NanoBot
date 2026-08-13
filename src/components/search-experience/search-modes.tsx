"use client";

import React from "react";
import { SearchMode, SEARCH_MODES_LIST } from "./search-demo-data";
import { Sparkle } from "@phosphor-icons/react";

interface SearchModesProps {
  activeMode: SearchMode;
  onSelectMode: (mode: SearchMode) => void;
}

export function SearchModes({ activeMode, onSelectMode }: SearchModesProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap pb-2">
      {SEARCH_MODES_LIST.map((mode) => {
        const isActive = activeMode === mode.id;
        return (
          <button
            key={mode.id}
            type="button"
            onClick={() => onSelectMode(mode.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans transition-all duration-200 ${
              isActive
                ? "bg-black text-white font-medium shadow-xs"
                : "bg-white border border-[#EAEAEA] text-neutral-500 hover:text-black hover:border-neutral-300"
            }`}
          >
            {isActive && <Sparkle weight="bold" className="h-3 w-3" />}
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
