"use client";

import React from "react";
import { CheckCircle, Circle, CircleNotch, XCircle } from "@phosphor-icons/react";

export type StepState = "pending" | "running" | "complete" | "error";

interface AgentStepItemProps {
  label: string;
  submessage?: string | null;
  state: StepState;
}

export function AgentStepItem({ label, submessage, state }: AgentStepItemProps) {
  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 rounded-xl transition-colors ${
        state === "running"
          ? "bg-[#EAF7EE] border border-[#16A34A]/20"
          : state === "error"
          ? "bg-rose-50/60 border border-rose-100"
          : ""
      }`}
    >
      <div className="mt-0.5 shrink-0">
        {state === "complete" && (
          <CheckCircle className="h-4 w-4 text-[#16A34A]" weight="fill" />
        )}
        {state === "running" && (
          <div className="relative flex items-center justify-center">
            <CircleNotch className="h-4 w-4 text-[#16A34A] animate-spin" weight="bold" />
          </div>
        )}
        {state === "pending" && (
          <Circle className="h-4 w-4 text-neutral-300" weight="regular" />
        )}
        {state === "error" && (
          <XCircle className="h-4 w-4 text-rose-500" weight="fill" />
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[13px] font-sans ${
              state === "complete"
                ? "text-black font-medium"
                : state === "running"
                ? "text-emerald-950 font-semibold"
                : state === "error"
                ? "text-rose-900 font-semibold"
                : "text-[#6B7280] font-normal"
            }`}
          >
            {label}
          </span>
          {state === "running" && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16A34A]" />
            </span>
          )}
        </div>

        {submessage && (
          <p
            className={`text-[11px] font-mono mt-0.5 truncate ${
              state === "error"
                ? "text-rose-600 font-sans"
                : state === "running"
                ? "text-emerald-800"
                : "text-[#6B7280]"
            }`}
          >
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}
