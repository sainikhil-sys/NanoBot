"use client";

import React from "react";
import { motion } from "framer-motion";
import { DeepResearchInfo } from "./search-demo-data";
import { Books, CheckCircle, Sparkle } from "@phosphor-icons/react";

interface DeepResearchViewProps {
  researchData: DeepResearchInfo;
}

export function DeepResearchView({ researchData }: DeepResearchViewProps) {
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
          <Books weight="bold" className="h-4 w-4 text-black" />
          <h3 className="text-[14px] font-semibold text-black font-sans">
            Deep Research Synthesis
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-neutral-500">{researchData.sourcesCount} papers scanned</span>
          <span className="text-[#22C55E] font-semibold">{researchData.findingsCount} key findings</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>Corpus Extraction & Verification</span>
          <span>100% Complete</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-black rounded-full"
          />
        </div>
      </div>

      {/* Analyzing Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
        {researchData.analyzingItems.map((item, idx) => (
          <div
            key={item}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#EAEAEA] text-xs font-sans text-neutral-700"
          >
            <CheckCircle weight="fill" className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />
            <span className="truncate">{item}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
