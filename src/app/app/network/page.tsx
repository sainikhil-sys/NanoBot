"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SYSTEM_BOTS } from "@/lib/bots/registry";
import { Bot } from "@/types/database.types";
import {
  Sparkle,
  ArrowRight,
  Robot,
  Cpu,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

const BOT_ACCENTS: Record<string, string> = {
  ChatBot: "#A855F7",
  CodeBot: "#F97316",
  VisionBot: "#14B8A6",
  ResearchBot: "#3B82F6",
  DataBot: "#22C55E",
  DocumentBot: "#F97316",
  StudyBot: "#A855F7",
};

export default function BotNetworkPage() {
  const [selectedBot, setSelectedBot] = useState<Bot>(SYSTEM_BOTS[0]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header
        title="Bot Network"
        description="Topology mesh and capability distribution across specialized neural modules"
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Network Canvas Card */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB] flex flex-row items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-black font-sans">
                Neural Capability Mesh
              </h2>
              <p className="text-[13px] text-neutral-500 font-sans mt-0.5">
                Interactive orchestration topology. Select a node to view capability routing.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] text-[11px] font-mono text-neutral-600">
              <span className="h-2 w-2 rounded-full bg-[#A3FF6F] animate-pulse-dot" />
              <span>7 Nodes Connected</span>
            </div>
          </div>

          <div className="p-8">
            <div
              className="relative min-h-[400px] w-full rounded-2xl border border-[#EBEBEB] p-8 flex flex-col items-center justify-center bg-[#FAFAFA]"
              style={{
                backgroundImage: "radial-gradient(circle, #D0D0D0 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            >
              {/* Orchestrator Center Core Node */}
              <div className="relative z-10 mb-10 p-5 rounded-2xl bg-white border-2 border-black shadow-md flex flex-col items-center text-center max-w-[220px]">
                <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center mb-2 shadow-xs">
                  <Sparkle weight="fill" className="h-4 w-4" />
                </div>
                <div className="text-[13px] font-bold text-black font-sans">
                  Task Orchestrator
                </div>
                <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                  Intent & Routing Core
                </div>
              </div>

              {/* Bot Network Mesh Nodes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 w-full max-w-5xl z-10">
                {SYSTEM_BOTS.map((bot) => {
                  const isSelected = selectedBot.slug === bot.slug;
                  const accent = BOT_ACCENTS[bot.name] || "#000";

                  return (
                    <motion.button
                      key={bot.slug}
                      type="button"
                      onClick={() => setSelectedBot(bot)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all min-h-[130px] ${
                        isSelected
                          ? "border-black bg-white shadow-md ring-1 ring-black"
                          : "border-[#EBEBEB] bg-white/80 backdrop-blur-sm hover:bg-white hover:border-[#D4D4D4]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <div
                            className="h-7 w-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${accent}15` }}
                          >
                            <Robot className="h-4 w-4" style={{ color: accent }} />
                          </div>
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: accent }}
                          />
                        </div>
                        <div className="text-[13px] font-semibold text-black truncate font-sans">
                          {bot.name}
                        </div>
                        <div
                          className="text-[9px] font-mono uppercase tracking-wider mt-0.5"
                          style={{ color: accent }}
                        >
                          {bot.category}
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-neutral-400 mt-2">
                        {bot.capabilities.length} Caps
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Bot Details Inspector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-xs">
            <div className="flex flex-row items-center justify-between pb-4 border-b border-[#EBEBEB] mb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[18px] font-semibold text-black font-sans">
                    {selectedBot.name}
                  </h3>
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full"
                    style={{
                      color: BOT_ACCENTS[selectedBot.name] || "#000",
                      backgroundColor: `${BOT_ACCENTS[selectedBot.name] || "#000"}15`,
                    }}
                  >
                    {selectedBot.category}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-500 font-sans mt-1">
                  {selectedBot.description}
                </p>
              </div>

              <Link
                href={`/app/bots/${selectedBot.slug}`}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-medium text-black font-sans transition-colors shadow-2xs"
              >
                <span>Full Profile</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold">
                Specialized Processing Capabilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedBot.capabilities.map((cap) => (
                  <div
                    key={cap}
                    className="p-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] flex items-center gap-2.5 text-[13px] font-sans"
                  >
                    <Sparkle className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span className="font-medium text-black">{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inter-bot Routing Mesh Rules */}
          <div className="rounded-3xl border border-[#EBEBEB] bg-white p-7 shadow-xs space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold pb-3 border-b border-[#EBEBEB]">
              Routing Protocols
            </div>
            <div className="space-y-3.5 text-[13px] font-sans">
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EBEBEB] space-y-1.5">
                <div className="font-semibold text-black flex items-center gap-2">
                  <ArrowsLeftRight className="h-4 w-4 text-black" />
                  <span>Dynamic Capability Binding</span>
                </div>
                <p className="text-[12px] text-neutral-500 leading-relaxed font-sans">
                  Incoming tasks are decomposed into sub-intents. Required capabilities are matched using cosine similarity over canonical keyword tensors.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#EBEBEB] space-y-1.5">
                <div className="font-semibold text-black flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-black" />
                  <span>Layered Fallback Protection</span>
                </div>
                <p className="text-[12px] text-neutral-500 leading-relaxed font-sans">
                  If an input lacks explicit modality anchors, the system routes through multi-turn conversational reasoning before failing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
