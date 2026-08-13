"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Conversation } from "@/types/database.types";
import { formatDate } from "@/lib/utils";
import { ClockCounterClockwise, ChatDots, Eye, Trash, Plus } from "@phosphor-icons/react";

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || []);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900">
      <Header
        title="History"
        description="View and manage your previous assistant chats, web searches, and vector sessions"
        actions={
          <Link
            href="/app/conversations"
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs transition-colors"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </Link>
        }
      />

      <main className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6 flex-1">
        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center shadow-2xs">
                <ClockCounterClockwise weight="bold" className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black font-sans">
                  Conversation & Search History
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  {conversations.length} total recorded session{conversations.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400 font-sans">
                Loading history...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <ChatDots className="h-8 w-8 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-500 font-sans">
                  No conversation history yet. Start your first session!
                </p>
                <Link
                  href="/app/conversations"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-black text-white text-xs font-medium"
                >
                  Start Chat
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black truncate font-sans">
                          {c.title || "Assistant Session"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 font-mono text-[9px] uppercase text-neutral-600 font-semibold">
                          {c.bot?.name || "AI Search"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 font-mono">
                        Created {formatDate(c.created_at)}
                      </p>
                    </div>

                    <Link
                      href="/app/conversations"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-[#EBEBEB] bg-white hover:border-black text-neutral-600 hover:text-black transition-colors shadow-2xs"
                      title="Open conversation"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
