"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SearchResultItem } from "./search-demo-data";
import { ArrowUpRight, CheckCircle, MapPin, Clock } from "@phosphor-icons/react";

interface SearchResultCardProps {
  result: SearchResultItem;
  isActive: boolean;
  isHighlighted?: boolean;
  index: number;
  onHover?: () => void;
}

export function SearchResultCard({
  result,
  isActive,
  isHighlighted,
  index,
  onHover,
}: SearchResultCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score from 0 up to target percentage
  useEffect(() => {
    let start = 0;
    const target = result.confidence;
    const duration = 500;
    const stepTime = 25;
    const totalSteps = duration / stepTime;
    const increment = target / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result.confidence]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.3,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      onMouseEnter={onHover}
      className={`rounded-2xl border p-4 sm:p-4.5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${
        isActive || isHighlighted
          ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/15 bg-white shadow-sm"
          : "border-[#EAEAEA] bg-white hover:border-[#C5C5C5] shadow-2xs opacity-95 hover:opacity-100 hover:shadow-xs"
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Upvote Pill */}
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-neutral-500 bg-[#F5F5F5] border border-[#EAEAEA] rounded-lg px-2 py-1 shrink-0 mt-0.5 sm:mt-0 group-hover:text-black transition-colors">
          <span>↑</span>
          <span>{result.upvotes}</span>
        </div>

        {/* Title & Domain Info */}
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[13px] sm:text-[14px] font-semibold text-black tracking-tight truncate font-sans group-hover:text-[#1A1A1A]">
              {result.title}
            </h4>

            {/* Verification Badge */}
            {result.verification === "verified" ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                <CheckCircle weight="fill" className="h-2.5 w-2.5" />
                <span>Verified</span>
              </span>
            ) : result.verification === "reference" ? (
              <span className="text-[10px] font-mono text-neutral-400">
                • Reference
              </span>
            ) : (
              <span className="text-[10px] font-mono text-neutral-400">
                • Community
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-neutral-400 font-mono flex-wrap">
            <span className="truncate">{result.domain}</span>
            <span>•</span>
            <span className="text-neutral-500 shrink-0">{result.tag}</span>

            {result.distance && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-neutral-600">
                  <MapPin className="h-3 w-3" />
                  <span>{result.distance}</span>
                </span>
              </>
            )}

            {result.statusBadge && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold">
                  <Clock className="h-3 w-3" />
                  <span>{result.statusBadge}</span>
                </span>
              </>
            )}
          </div>

          {result.snippet && (
            <p className="text-[12px] text-neutral-500 font-sans leading-relaxed pt-1 line-clamp-1 hidden sm:block">
              {result.snippet}
            </p>
          )}
        </div>
      </div>

      {/* Right Side: AI Match Score & Action Arrow */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F5F5F5]">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span>AI {animatedScore}%</span>
        </span>

        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 group-hover:text-black inline-flex items-center gap-1 text-[11px] font-sans font-medium">
          <span>Open</span>
          <ArrowUpRight weight="bold" className="h-3 w-3" />
        </span>
      </div>
    </motion.div>
  );
}
