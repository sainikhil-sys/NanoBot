"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  Paperclip,
  ArrowRight,
  Stop,
  Sparkle,
} from "@phosphor-icons/react";
import { BotSelector } from "./bot-selector";

interface ChatComposerProps {
  onSend: (message: string, botId: string, webSearch: boolean) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  selectedBotId: string;
  onSelectBot: (botId: string) => void;
  technicalView?: boolean;
  onToggleTechnicalView?: () => void;
  placeholder?: string;
  initialValue?: string;
}

export function ChatComposer({
  onSend,
  onStop,
  isStreaming = false,
  selectedBotId = "auto",
  onSelectBot,
  placeholder = "Ask anything or search the web...",
  initialValue = "",
}: ChatComposerProps) {
  const [input, setInput] = useState(initialValue);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setInput(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSend(input.trim(), selectedBotId, webSearchActive);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput((prev) => (prev ? `${prev} (Attached file: ${file.name})` : `Analyze this file: ${file.name}`));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-sm hover:border-black/30 focus-within:border-black transition-all space-y-3"
    >
      <textarea
        ref={textareaRef}
        rows={2}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isStreaming}
        className="w-full px-2 pt-1 text-[14px] font-sans text-black placeholder:text-[#6B7280] bg-transparent border-0 focus:outline-none resize-none leading-relaxed"
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Controls Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB] px-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bot Selector Dropdown (Defaults to AUTO) */}
          <BotSelector
            selectedBotId={selectedBotId}
            onSelectBot={onSelectBot}
            disabled={isStreaming}
          />

          {/* Web Search Availability Toggle */}
          <button
            type="button"
            onClick={() => setWebSearchActive(!webSearchActive)}
            disabled={isStreaming}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${
              webSearchActive
                ? "bg-[#EAF7EE] text-[#16A34A] border border-[#16A34A]/20 font-semibold"
                : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280] hover:text-black"
            }`}
            title="Enable live web research capability"
          >
            <Globe weight={webSearchActive ? "bold" : "regular"} className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>Web Search</span>
          </button>

          {/* File Attachment Button */}
          <button
            type="button"
            onClick={handleFileClick}
            disabled={isStreaming}
            className="p-1.5 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white text-[#6B7280] hover:text-black transition-colors"
            title="Attach document or file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </div>

        {/* Send or Stop Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="h-9 w-9 rounded-full bg-rose-600 text-white hover:bg-rose-700 flex items-center justify-center transition-all shadow-xs shrink-0"
            title="Stop generation"
          >
            <Stop weight="fill" className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-9 w-9 rounded-full bg-black text-white hover:bg-[#1A1A1A] flex items-center justify-center transition-all disabled:opacity-40 shadow-xs shrink-0"
            title="Send message"
          >
            <ArrowRight weight="bold" className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}
