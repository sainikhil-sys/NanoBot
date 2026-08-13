"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SavedItem, VectorRecord } from "@/types/database.types";
import { formatDate } from "@/lib/utils";
import { BookmarkSimple, Trash, Eye, Sparkle, Pulse, FileText } from "@phosphor-icons/react";

export default function SavedPage() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [vectors, setVectors] = useState<VectorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      try {
        const [savedRes, vecRes] = await Promise.all([
          fetch("/api/saved"),
          fetch("/api/embeddings"),
        ]);
        if (savedRes.ok) {
          const sData = await savedRes.json();
          setSavedItems(sData.items || []);
        }
      } catch (err) {
        console.error("Failed to load saved items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSaved();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/saved?id=${id}`, { method: "DELETE" });
      setSavedItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900">
      <Header
        title="Saved Items"
        description="Quick access to your bookmarked AI outputs, code snippets, and vector records"
      />

      <main className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-6 flex-1">
        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center shadow-2xs">
                <BookmarkSimple weight="bold" className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-black font-sans">
                  Saved Bookmarks & Records
                </h3>
                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                  {savedItems.length} saved item{savedItems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400 font-sans">
                Loading saved items...
              </div>
            ) : savedItems.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <BookmarkSimple className="h-8 w-8 text-neutral-300 mx-auto" />
                <p className="text-xs text-neutral-500 font-sans">
                  No saved items yet. Bookmark chats, code, or vectors for quick retrieval!
                </p>
                <Link
                  href="/app/embeddings"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-black text-white text-xs font-medium"
                >
                  Generate Vectors
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F0]">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 flex items-start justify-between hover:bg-[#FAFAFA] transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black truncate font-sans">
                          {item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#059669] font-mono text-[9px] uppercase font-bold border border-emerald-200">
                          {item.item_type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 font-sans line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Saved on {formatDate(item.created_at)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete saved item"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
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
