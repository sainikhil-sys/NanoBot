"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatusPill } from "@/components/ui/status-pill";
import { Bot, Conversation } from "@/types/database.types";
import { formatDate } from "@/lib/utils";
import {
  Robot,
  ArrowLeft,
  ChatDots,
  Plus,
  Eye,
  Sparkle,
  CheckCircle,
  Percent,
} from "@phosphor-icons/react";

const BOT_ACCENTS: Record<string, string> = {
  ChatBot: "#A855F7",
  CodeBot: "#F97316",
  VisionBot: "#14B8A6",
  ResearchBot: "#3B82F6",
  DataBot: "#22C55E",
  DocumentBot: "#F97316",
  StudyBot: "#A855F7",
};

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const botId = params.id as string;

  const [bot, setBot] = useState<Bot | null>(null);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBotDetail() {
      try {
        const [botRes, convRes] = await Promise.all([
          fetch(`/api/bots/${botId}`),
          fetch("/api/conversations"),
        ]);
        if (botRes.ok) {
          const data = await botRes.json();
          setBot(data.bot);
        }
        if (convRes.ok) {
          const cData = await convRes.json();
          setRecentConversations(cData.conversations || []);
        }
      } catch (err) {
        console.error("Failed to fetch bot detail:", err);
      } finally {
        setLoading(false);
      }
    }
    if (botId) {
      loadBotDetail();
    }
  }, [botId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header title="Loading Bot Profile..." />
        <main className="p-8 max-w-7xl mx-auto w-full text-center text-xs text-neutral-400 font-sans">
          Retrieving neural capability specifications...
        </main>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header title="Bot Profile Not Found" />
        <main className="p-8 max-w-7xl mx-auto w-full text-center space-y-4">
          <p className="text-xs text-neutral-500 font-sans">
            The requested bot profile does not exist in the neural registry.
          </p>
          <button
            onClick={() => router.push("/app/bots")}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-black text-white text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Bot Registry</span>
          </button>
        </main>
      </div>
    );
  }

  const accent = BOT_ACCENTS[bot.name] || "#000";

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900">
      <Header
        title={bot.name}
        description={`Specialized in ${bot.category}`}
        actions={
          <button
            onClick={() => router.push("/app/bots")}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-medium text-black transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Registry</span>
          </button>
        }
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        {/* Profile Card - 100% Neutral Design */}
        <div className="rounded-3xl border border-[#E5E5E5] bg-white p-8 shadow-xs hover:border-[#D4D4D4] transition-colors relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
                style={{ backgroundColor: `${accent}15` }}
              >
                <Robot weight="bold" className="h-7 w-7" style={{ color: accent }} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[22px] font-bold text-black tracking-tight font-sans">
                    {bot.name}
                  </h2>
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full"
                    style={{ color: accent, backgroundColor: `${accent}15` }}
                  >
                    {bot.category}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] text-neutral-600 font-medium">
                    {bot.status}
                  </span>
                </div>
                <p className="text-[13px] text-neutral-500 mt-1 max-w-2xl font-sans leading-relaxed">
                  {bot.description}
                </p>
              </div>
            </div>

            <Link
              href="/app/conversations"
              className="inline-flex items-center justify-center transition-all duration-200 h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <ChatDots weight="bold" className="h-3.5 w-3.5" />
              <span>Start Chat with {bot.name}</span>
            </Link>
          </div>

          {/* Capabilities Section */}
          <div className="mt-8 pt-6 border-t border-[#EBEBEB]">
            <div className="text-[11px] font-mono uppercase text-neutral-400 font-semibold mb-3">
              Bound Neural Capabilities
            </div>
            <div className="flex flex-wrap gap-2">
              {bot.capabilities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] border border-[#EBEBEB] text-xs font-sans text-neutral-800 font-medium"
                >
                  <Sparkle className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{c}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400 mb-2 font-mono text-[11px] uppercase tracking-wider">
              <span>Status</span>
              <Robot className="h-4 w-4 text-black" />
            </div>
            <div className="text-[26px] font-bold font-mono text-black">
              Online
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-1">Routed via NanoBot Auto-Router</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400 mb-2 font-mono text-[11px] uppercase tracking-wider">
              <span>Active Sessions</span>
              <ChatDots className="h-4 w-4 text-black" />
            </div>
            <div className="text-[26px] font-bold font-mono text-black">
              {recentConversations.length}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-1">Assistant sessions</div>
          </div>

          <div className="p-6 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] shadow-2xs">
            <div className="flex items-center justify-between text-neutral-400 mb-2 font-mono text-[11px] uppercase tracking-wider">
              <span>Reliability</span>
              <Percent className="h-4 w-4 text-black" />
            </div>
            <div className="text-[26px] font-bold font-mono text-black">
              100%
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-1">Pipeline reliability</div>
          </div>
        </div>

        {/* Recent Assistant Conversations */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB]">
            <h3 className="text-[16px] font-semibold text-black font-sans">
              Recent Conversations
            </h3>
            <p className="text-[12px] text-neutral-500 font-sans mt-0.5">
              Assistant session threads in workspace
            </p>
          </div>
          <div className="p-0">
            {recentConversations.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400 font-sans">
                No active conversations yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] font-sans">
                  <thead>
                    <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]/70">
                      <th className="text-left py-3.5 px-6 font-mono text-[11px] uppercase text-neutral-400 font-medium">Title</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Created</th>
                      <th className="text-right py-3.5 px-6 font-mono text-[11px] uppercase text-neutral-400 font-medium">Open</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentConversations.slice(0, 5).map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors ${
                          idx % 2 === 1 ? "bg-[#FAFAFA]/30" : ""
                        }`}
                      >
                        <td className="py-4 px-6 font-medium text-black max-w-sm truncate text-xs font-sans">
                          {c.title || "Assistant Session"}
                        </td>
                        <td className="py-4 px-4 text-neutral-400 text-[11px] font-mono">
                          {formatDate(c.created_at)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href="/app/conversations"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-[#EBEBEB] bg-white hover:border-black text-neutral-500 hover:text-black transition-colors shadow-2xs"
                            title="Open Chat"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
