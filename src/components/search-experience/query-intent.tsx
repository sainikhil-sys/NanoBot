"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Brain, Lightning } from "@phosphor-icons/react";

interface QueryIntentProps {
  intent: string;
  category: string;
  steps: string[];
  stepIndex: number;
  isUnderstanding: boolean;
}

export function QueryIntent({
  intent,
  category,
  steps,
  stepIndex,
  isUnderstanding,
}: QueryIntentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 my-3">
      {/* Intent Category Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EAEAEA] shadow-2xs text-[11px] font-sans"
      >
        <div className="flex items-center gap-1 text-black font-semibold">
          <Brain weight="bold" className="h-3.5 w-3.5" />
          <span>Intent:</span>
        </div>
        <span className="text-neutral-600">{intent}</span>
        <span className="text-neutral-300">•</span>
        <span className="text-neutral-400 font-mono text-[10px] uppercase">
          {category}
        </span>
      </motion.div>

      {/* Sequential Understanding Steps */}
      {isUnderstanding && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 text-[11px] font-mono text-neutral-500 flex-wrap justify-center"
        >
          {steps.map((step, idx) => {
            const isCompleted = idx <= stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <div
                key={step}
                className={`flex items-center gap-1 transition-colors duration-300 ${
                  isCompleted ? "text-neutral-900 font-medium" : "text-neutral-300"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle weight="fill" className="h-3 w-3 text-[#22C55E]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
