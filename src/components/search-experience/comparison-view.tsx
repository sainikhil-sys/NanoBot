"use client";

import React from "react";
import { motion } from "framer-motion";
import { ComparisonMetric } from "./search-demo-data";
import { Scales, CheckCircle } from "@phosphor-icons/react";

interface ComparisonViewProps {
  optionA: string;
  optionB: string;
  metrics: ComparisonMetric[];
}

export function ComparisonView({
  optionA,
  optionB,
  metrics,
}: ComparisonViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-2xl border border-[#EAEAEA] bg-white p-5 sm:p-6 shadow-2xs space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F5F5F5]">
        <div className="flex items-center gap-2">
          <Scales weight="bold" className="h-4 w-4 text-black" />
          <h3 className="text-[14px] font-semibold text-black font-sans">
            Architectural Benchmark Comparison
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono font-semibold">
          <span className="text-black">{optionA}</span>
          <span className="text-neutral-300">vs</span>
          <span className="text-neutral-500">{optionB}</span>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-4">
        {metrics.map((m, idx) => (
          <div key={m.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-sans">
              <span className="font-medium text-neutral-800">{m.name}</span>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="font-semibold text-black">{m.optionA.score}%</span>
                <span className="text-neutral-400">{m.optionB.score}%</span>
              </div>
            </div>

            {/* Dual Bar */}
            <div className="grid grid-cols-2 gap-2">
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden flex justify-end">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.optionA.score}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="h-full bg-black rounded-full"
                />
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.optionB.score}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="h-full bg-neutral-400 rounded-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
