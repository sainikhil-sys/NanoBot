"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkle,
  Globe,
  Code,
  FileText,
  Pulse,
  Scissors,
  ChatCircle,
  CaretDown,
  Check,
} from "@phosphor-icons/react";
import { listAvailableBots, BotDefinition } from "@/lib/ai/routing/bot-registry";

interface BotSelectorProps {
  selectedBotId: string;
  onSelectBot: (botId: string) => void;
  disabled?: boolean;
}

export function BotSelector({ selectedBotId, onSelectBot, disabled }: BotSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bots = listAvailableBots();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getBotIcon = (iconName: string, className = "h-3.5 w-3.5") => {
    switch (iconName) {
      case "Globe":
        return <Globe weight="bold" className={className} />;
      case "Code":
        return <Code weight="bold" className={className} />;
      case "FileText":
        return <FileText weight="bold" className={className} />;
      case "Pulse":
        return <Pulse weight="bold" className={className} />;
      case "Scissors":
        return <Scissors weight="bold" className={className} />;
      case "ChatCircle":
        return <ChatCircle weight="bold" className={className} />;
      default:
        return <Sparkle weight="bold" className={className} />;
    }
  };

  const currentBot = bots.find((b) => b.id === selectedBotId) || bots[0];

  return (
    <div className="relative inline-block text-left select-none" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans border transition-colors shadow-2xs ${
          currentBot.id === "auto"
            ? "bg-[#EAF7EE] border-[#16A34A]/30 text-[#16A34A] font-semibold"
            : "bg-[#FAFAFA] border-[#E5E7EB] text-black hover:bg-neutral-100"
        }`}
      >
        {getBotIcon(currentBot.iconName, "h-3.5 w-3.5")}
        <span>{currentBot.shortName}</span>
        <CaretDown className="h-3 w-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-2xl border border-[#E5E7EB] bg-white p-1.5 shadow-xl space-y-0.5 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[#6B7280] font-semibold border-b border-[#F0F0F0] mb-1">
            Select NanoBot Capability
          </div>

          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {bots.map((bot) => {
              const isSelected = bot.id === selectedBotId;
              return (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => {
                    onSelectBot(bot.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                    isSelected
                      ? "bg-[#EAF7EE] text-[#16A34A]"
                      : "hover:bg-neutral-50 text-black"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getBotIcon(bot.iconName, `h-4 w-4 ${isSelected ? "text-[#16A34A]" : "text-[#6B7280]"}`)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold font-sans truncate">
                        {bot.name}
                      </span>
                      {isSelected && <Check weight="bold" className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />}
                    </div>
                    <p className="text-[10px] text-[#6B7280] font-sans truncate mt-0.5">
                      {bot.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
