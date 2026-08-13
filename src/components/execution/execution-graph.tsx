"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { TaskStep } from "@/types/database.types";

interface ExecutionGraphProps {
  steps: TaskStep[];
  currentStepIndex?: number;
}

export function ExecutionGraph({ steps, currentStepIndex = 0 }: ExecutionGraphProps) {
  const orderedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.step_order - b.step_order);
  }, [steps]);

  if (orderedSteps.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-neutral-200 rounded-lg text-xs font-mono text-neutral-400">
        Execution graph uninitialized
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
      <div className="flex items-center min-w-max gap-2 sm:gap-3 py-2">
        {orderedSteps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isRunning = step.status === "running";
          const isFailed = step.status === "failed";
          const isWaiting = step.status === "waiting";

          return (
            <React.Fragment key={step.id}>
              {/* Step Node */}
              <div className="flex flex-col items-center gap-1.5 group">
                <div
                  className={`relative flex items-center justify-center h-8 px-3 rounded border text-xs font-mono font-medium transition-all ${
                    isRunning
                      ? "bg-neutral-950 text-white border-neutral-950 shadow-xs"
                      : isCompleted
                      ? "bg-white text-neutral-950 border-neutral-900 shadow-2xs"
                      : isFailed
                      ? "bg-neutral-200 text-neutral-950 border-neutral-400"
                      : "bg-white text-neutral-400 border-neutral-200 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold">
                      {isCompleted ? "✓" : isRunning ? "●" : isFailed ? "×" : "○"}
                    </span>
                    <span className="truncate max-w-[130px]">{step.step_name}</span>
                  </div>

                  {isRunning && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute -inset-0.5 rounded border border-neutral-950 pointer-events-none opacity-40"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-1 text-[9px] font-mono text-neutral-400">
                  <span>L{step.step_order}</span>
                  <span>•</span>
                  <span className="truncate max-w-[90px]">{step.layer}</span>
                  {step.duration_ms !== null && (
                    <>
                      <span>•</span>
                      <span>{step.duration_ms}ms</span>
                    </>
                  )}
                </div>
              </div>

              {/* Connecting Line */}
              {idx < orderedSteps.length - 1 && (
                <div className="flex items-center pb-5 px-0.5">
                  <div
                    className={`h-[1px] w-5 sm:w-7 transition-colors ${
                      isCompleted ? "bg-neutral-900" : "bg-neutral-300"
                    }`}
                  />
                  <div
                    className={`h-1 w-1 rounded-full ${
                      isCompleted ? "bg-neutral-900" : "bg-neutral-300"
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
