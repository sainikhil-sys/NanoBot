"use client";

import React from "react";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react";

export type PipelineStage = "idle" | "tokenizing" | "embedding" | "projecting" | "complete" | "error";

interface PipelineAnimationProps {
  stage: PipelineStage;
}

export function PipelineAnimation({ stage }: PipelineAnimationProps) {
  const steps = [
    { key: "input", label: "Input Text" },
    { key: "tokenize", label: "Tokenize" },
    { key: "embed", label: "Embed Vector" },
    { key: "project", label: "2D Projection" },
    { key: "visualize", label: "Semantic Map" },
  ];

  const getStepState = (stepKey: string) => {
    if (stage === "error") return "error";
    if (stage === "complete") return "complete";

    if (stepKey === "input") return "complete";
    if (stepKey === "tokenize") {
      return stage === "idle" ? "idle" : stage === "tokenizing" ? "active" : "complete";
    }
    if (stepKey === "embed") {
      return stage === "embedding"
        ? "active"
        : (stage as string) === "projecting" || (stage as string) === "complete"
        ? "complete"
        : "idle";
    }
    if (stepKey === "project") {
      return stage === "projecting" ? "active" : (stage as string) === "complete" ? "complete" : "idle";
    }
    if (stepKey === "visualize") {
      return (stage as string) === "complete" ? "complete" : "idle";
    }

    return "idle";
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans shadow-2xs overflow-x-auto">
      {steps.map((step, idx) => {
        const state = getStepState(step.key);

        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2 shrink-0">
              {state === "complete" ? (
                <CheckCircle weight="fill" className="h-4 w-4 text-emerald-600" />
              ) : state === "active" ? (
                <CircleNotch className="h-4 w-4 text-blue-600 animate-spin" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-neutral-300 flex items-center justify-center text-[10px] text-neutral-400 font-mono">
                  {idx + 1}
                </div>
              )}
              <span
                className={`font-medium ${
                  state === "complete"
                    ? "text-black"
                    : state === "active"
                    ? "text-blue-600 font-semibold"
                    : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`h-[1px] w-6 shrink-0 transition-colors ${
                  state === "complete" ? "bg-emerald-500" : "bg-neutral-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
