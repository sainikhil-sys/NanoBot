"use client";

import React, { useState, useEffect } from "react";
import { Sparkle, Trash } from "@phosphor-icons/react";

interface EmbeddingInputProps {
  value: string;
  onChange: (val: string) => void;
  isLoading: boolean;
}

const SAMPLE_PROMPTS = [
  "artificial intelligence",
  "machine learning",
  "computer science",
  "apple",
  "neural networks",
  "database postgresql",
  "pizza and food",
];

export function EmbeddingInput({ value, onChange, isLoading }: EmbeddingInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // 300ms Debounce to prevent unnecessary API calls during rapid typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localValue, onChange, value]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="Enter a word, sentence, or paragraph to convert into a vector embedding..."
          rows={3}
          className="w-full p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] text-[14px] text-black placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-black transition-colors font-sans leading-relaxed resize-none shadow-2xs"
        />

        {localValue && (
          <button
            type="button"
            onClick={() => setLocalValue("")}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-200 transition-colors"
            title="Clear text"
          >
            <Trash className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Sample Text Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-neutral-400 uppercase font-semibold mr-1">
          Try Example:
        </span>
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setLocalValue(prompt);
              onChange(prompt);
            }}
            className={`px-3 py-1 rounded-full border text-[12px] font-sans transition-colors ${
              localValue === prompt
                ? "bg-black text-white border-black font-medium"
                : "bg-white border-[#EBEBEB] text-neutral-700 hover:border-black"
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
