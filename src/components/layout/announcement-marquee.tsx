"use client";

import React from "react";

const MARQUEE_ITEMS = [
  "COMMUNITY AI SEARCH",
  "✦",
  "NOW IN BETA",
  "✦",
  "DEVELOPER-RANKED RESULTS",
  "✦",
  "AI-POWERED PRECISION",
  "✦",
  "MULTI-BOT ORCHESTRATION",
  "✦",
  "TRANSPARENT EXECUTION",
  "✦",
];

export function AnnouncementMarquee() {
  return (
    <div className="w-full bg-[#16A34A] overflow-hidden py-2 border-b border-black/10 select-none marquee-container">
      <div className="animate-marquee-infinite whitespace-nowrap flex items-center gap-8">
        {/* Quadrupled items for completely seamless 0 -> -50% loop */}
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span
            key={i}
            className={`text-[11px] font-mono font-bold tracking-widest uppercase text-white whitespace-nowrap ${
              item === "✦" ? "text-white/80 scale-90" : ""
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
