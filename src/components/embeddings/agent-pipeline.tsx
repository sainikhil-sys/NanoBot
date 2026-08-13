"use client";

import React from "react";
import { Check, WarningCircle } from "@phosphor-icons/react";

export type PipelineNodeKey = "input" | "process" | "chunk" | "embed" | "vectordb" | "done";

export interface PipelineNodeStatus {
  key: PipelineNodeKey;
  label: string;
  state: "pending" | "active" | "complete" | "error";
}

interface AgentPipelineProps {
  nodes: PipelineNodeStatus[];
}

export function AgentPipeline({ nodes }: AgentPipelineProps) {
  return (
    <div className="w-full py-4 px-2 select-none overflow-x-auto">
      <div className="flex items-center justify-between min-w-[480px] gap-1 relative">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const nextNode = !isLast ? nodes[index + 1] : null;
          const isConnectionActive = node.state === "complete" && nextNode?.state === "active";
          const isConnectionDone = node.state === "complete" && (nextNode?.state === "complete" || nextNode?.state === "active");

          return (
            <React.Fragment key={node.key}>
              {/* Node Card */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`h-9 px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-mono transition-all duration-300 ${
                    node.state === "complete"
                      ? "bg-[#EAF7EE] border border-[#16A34A]/30 text-emerald-900 shadow-2xs"
                      : node.state === "active"
                      ? "bg-white border-2 border-[#16A34A] text-black shadow-md ring-4 ring-[#EAF7EE] scale-105 font-bold"
                      : node.state === "error"
                      ? "bg-rose-50 border-2 border-rose-400 text-rose-800 shadow-sm"
                      : "bg-[#FAFAFA] border border-[#E5E7EB] text-[#6B7280]"
                  }`}
                >
                  {node.state === "complete" && (
                    <Check weight="bold" className="h-3 w-3 text-[#16A34A]" />
                  )}
                  {node.state === "active" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-ping" />
                  )}
                  {node.state === "error" && (
                    <WarningCircle weight="fill" className="h-3 w-3 text-rose-500" />
                  )}
                  <span>{node.label}</span>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex-1 h-[2px] mx-1 relative overflow-hidden bg-neutral-200 rounded">
                  <div
                    className={`h-full transition-all duration-500 rounded ${
                      isConnectionDone
                        ? "bg-[#16A34A] w-full"
                        : isConnectionActive
                        ? "bg-emerald-400 w-full animate-pulse"
                        : "w-0"
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
