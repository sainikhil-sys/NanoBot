"use client";

import React from "react";
import { motion } from "framer-motion";
import { DebugDiagnostic } from "./search-demo-data";
import { Bug, CheckCircle, Cpu, Wrench } from "@phosphor-icons/react";

interface DebuggingViewProps {
  debugData: DebugDiagnostic;
}

export function DebuggingView({ debugData }: DebuggingViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-2xl border border-[#EAEAEA] bg-white p-5 sm:p-6 shadow-2xs space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F5]">
        <div className="flex items-center gap-2">
          <Bug weight="bold" className="h-4 w-4 text-red-500" />
          <h3 className="text-[14px] font-semibold text-black font-sans font-mono">
            {debugData.errorType}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span>Confidence {debugData.confidence}%</span>
        </span>
      </div>

      {/* Stages Pipeline */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase text-neutral-400 font-semibold">
          Diagnostic Trace
        </span>
        <div className="space-y-1">
          {debugData.stages.map((stage, idx) => (
            <motion.div
              key={stage}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className="flex items-center gap-2 text-xs font-mono text-neutral-600 bg-[#FAFAFA] border border-[#EAEAEA] rounded-lg p-2"
            >
              <CheckCircle weight="fill" className="h-3 w-3 text-[#22C55E] shrink-0" />
              <span className="truncate">{stage}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Root Cause and Code Fix */}
      <div className="p-3.5 rounded-xl bg-neutral-900 text-white font-mono text-[12px] space-y-2 border border-neutral-800">
        <div className="flex items-center gap-1.5 text-neutral-400 text-[10px] uppercase">
          <Cpu className="h-3.5 w-3.5 text-[#A3FF6F]" />
          <span>Root Cause Synthesis</span>
        </div>
        <p className="text-neutral-200 text-xs font-sans leading-relaxed">
          {debugData.rootCause}
        </p>

        <div className="pt-2 border-t border-neutral-800 space-y-1">
          <div className="flex items-center gap-1.5 text-[#A3FF6F] text-[10px] uppercase font-bold">
            <Wrench className="h-3 w-3" />
            <span>Deterministic Solution</span>
          </div>
          <code className="text-white text-[11px] block bg-black/60 p-2 rounded border border-neutral-800">
            {debugData.suggestedFix}
          </code>
        </div>
      </div>
    </motion.div>
  );
}
