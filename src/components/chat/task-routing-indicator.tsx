"use client";

import React from "react";
import { CircleNotch } from "@phosphor-icons/react";

export interface TaskRoutingState {
  botId: string;
  botName: string;
  category?: string;
  confidence?: number;
  reason?: string;
  tools?: string[];
  statusMessage?: string;
  isRouting: boolean;
}

interface TaskRoutingIndicatorProps {
  routing: TaskRoutingState;
  technicalView?: boolean;
}

export function TaskRoutingIndicator({ routing, technicalView = false }: TaskRoutingIndicatorProps) {
  // If Technical View is explicitly enabled, render the full architectural capability block
  if (technicalView) {
    return (
      <div className="p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] text-xs font-sans space-y-1.5 animate-fadeIn">
        <div className="flex items-center justify-between text-[#6B7280]">
          <span className="font-mono uppercase text-[10px] font-semibold">Router Capability</span>
          <span className="font-mono text-[10px] text-black font-medium">{routing.botName}</span>
        </div>
        {routing.tools && routing.tools.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#6B7280]">Tools:</span>
            {routing.tools.map((t, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-[#E5E7EB] text-[9px] font-mono text-black">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal Chat Mode: show only minimal operational status during live execution if relevant
  if (routing.isRouting) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-sans text-[#6B7280] py-0.5 animate-fadeIn">
        <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
        <span>Thinking...</span>
      </div>
    );
  }

  if (routing.statusMessage) {
    return (
      <div className="inline-flex items-center gap-2 text-xs font-sans text-[#6B7280] py-0.5 animate-fadeIn">
        <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
        <span>{routing.statusMessage}</span>
      </div>
    );
  }

  // In normal mode, once routed and no operational message, remain completely invisible
  return null;
}
