"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";

interface ProjectedPoint {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface VectorSpaceProps {
  points: ProjectedPoint[];
  inputText: string;
}

export function VectorSpace({ points, inputText }: VectorSpaceProps) {
  // Center coordinates relative to canvas (width 600, height 360)
  const centerX = 300;
  const centerY = 180;

  return (
    <div className="rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] p-6 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB] relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-black font-sans flex items-center gap-2">
            <Sparkle className="h-4 w-4 text-blue-600" />
            <span>2D Semantic Vector Space (PCA Projection)</span>
          </h3>
          <p className="text-[11px] text-neutral-500 font-sans mt-0.5">
            Real PCA dimensional reduction from 384 / 1536 high-dimensional embedding space
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-white border border-[#EBEBEB] text-[10px] font-mono text-neutral-600 shadow-2xs">
          Cosine Distance Plot
        </div>
      </div>

      {/* Canvas Plot Container */}
      <div className="relative w-full h-[280px] my-4 bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden flex items-center justify-center shadow-inner">
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[radial-[#E5E7EB]_1px,transparent_1px] [background-size:16px_16px] opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 border-b border-neutral-100 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 border-r border-neutral-100 pointer-events-none" />

        {/* Vector Points */}
        {points.map((pt) => {
          const isUserInput = pt.id === "user-input";
          const posX = Math.max(30, Math.min(570, centerX + pt.x));
          const posY = Math.max(30, Math.min(250, centerY + pt.y));

          return (
            <motion.div
              key={pt.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ x: posX - centerX, y: posY - centerY, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="absolute z-20 flex flex-col items-center pointer-events-auto"
            >
              {isUserInput ? (
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <span className="absolute -inset-2 rounded-full bg-blue-500/20 animate-ping" />
                    <div className="h-4 w-4 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="mt-1.5 px-2.5 py-1 rounded-xl bg-black text-white text-[11px] font-bold font-sans tracking-tight shadow-md flex items-center gap-1 max-w-[180px] truncate">
                    <span>★</span>
                    <span className="truncate">{inputText || "YOUR INPUT"}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center group cursor-pointer">
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-400 border border-white group-hover:bg-black group-hover:scale-125 transition-all" />
                  <div className="mt-1 px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-700 text-[10px] font-mono group-hover:bg-neutral-800 group-hover:text-white transition-colors shadow-2xs">
                    {pt.text}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-sans pt-3 border-t border-[#EBEBEB]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="font-medium text-black">Your Input Vector</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" />
            <span>Reference Concepts</span>
          </div>
        </div>
        <span className="font-mono text-[10px] text-neutral-400">
          Closer distance = higher semantic similarity
        </span>
      </div>
    </div>
  );
}
