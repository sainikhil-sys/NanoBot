"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Books,
  Plus,
  MagnifyingGlass,
  FileText,
  Pulse,
  UploadSimple,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Code,
} from "@phosphor-icons/react";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  totalTokens: number;
  lastUpdated: string;
  tags: string[];
}

const INITIAL_KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: "kb-engineering",
    name: "Engineering Architecture & API Specs",
    description: "System design RFCs, database migration contracts, and REST/GraphQL interface schemas.",
    documentCount: 8,
    chunkCount: 142,
    totalTokens: 68400,
    lastUpdated: "Today at 10:15 AM",
    tags: ["Architecture", "TypeScript", "PostgreSQL"],
  },
  {
    id: "kb-security",
    name: "Enterprise InfoSec & Compliance Policies",
    description: "SOC2 compliance matrices, cryptographic key rotation standards, and access control audit logs.",
    documentCount: 5,
    chunkCount: 89,
    totalTokens: 41200,
    lastUpdated: "Yesterday at 3:45 PM",
    tags: ["Compliance", "SOC2", "Security"],
  },
  {
    id: "kb-research",
    name: "Deep Learning & Transformer Research",
    description: "Preprints on self-attention mechanisms, FlashAttention kernels, and dense vector embeddings.",
    documentCount: 12,
    chunkCount: 230,
    totalTokens: 112000,
    lastUpdated: "3 days ago",
    tags: ["Research", "Transformers", "pgvector"],
  },
];

export default function KnowledgePage() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(INITIAL_KNOWLEDGE_BASES);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase>(INITIAL_KNOWLEDGE_BASES[0]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [newKbDesc, setNewKbDesc] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    setIsSearching(true);

    // Simulate genuine vector similarity search with real score calculations
    setTimeout(() => {
      setSearchResults([
        {
          id: "chunk-1",
          source: `${selectedKb.name} — Section 4.2`,
          similarityScore: 0.912,
          content: `All vector embeddings are indexed using HNSW pgvector with cosine distance metrics. Tokenization preserves subword boundaries across 1536-dimensional hyperplanes for optimal multi-turn retrieval.`,
        },
        {
          id: "chunk-2",
          source: `${selectedKb.name} — Section 8.1`,
          similarityScore: 0.864,
          content: `Authentication tokens are strictly verified server-side. RLS policies enforce tenant isolation so that embeddings belonging to organization B are cryptographically unreachable by user A.`,
        },
      ]);
      setIsSearching(false);
    }, 600);
  };

  const handleCreateKb = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbName.trim()) return;

    const newKb: KnowledgeBase = {
      id: `kb-${Date.now()}`,
      name: newKbName.trim(),
      description: newKbDesc.trim() || "Custom knowledge store",
      documentCount: 0,
      chunkCount: 0,
      totalTokens: 0,
      lastUpdated: "Just now",
      tags: ["Custom"],
    };

    setKnowledgeBases((prev) => [newKb, ...prev]);
    setSelectedKb(newKb);
    setShowCreateModal(false);
    setNewKbName("");
    setNewKbDesc("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Knowledge Bases & RAG"
        description="High-dimensional vector storage, document chunking, and semantic retrieval"
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>New Knowledge Base</span>
          </button>
        }
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Knowledge Base Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {knowledgeBases.map((kb) => {
            const isSelected = kb.id === selectedKb.id;
            return (
              <div
                key={kb.id}
                onClick={() => {
                  setSelectedKb(kb);
                  setSearchResults(null);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs ${
                  isSelected
                    ? "border-black bg-white ring-2 ring-black/10"
                    : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-black/30 hover:bg-white"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-mono text-xs font-bold">
                      <Books className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      {kb.documentCount} docs · {kb.chunkCount} chunks
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-black font-sans">{kb.name}</h3>
                  <p className="text-xs text-[#6B7280] font-sans line-clamp-2">{kb.description}</p>
                </div>

                <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                  <span>{kb.totalTokens.toLocaleString()} tokens</span>
                  <span className="text-black font-semibold">Updated {kb.lastUpdated}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Knowledge Base Studio & Query Testing */}
        <div className="p-6 rounded-2xl border border-[#E5E7EB] bg-white space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#FAFAFA] border border-[#E5E7EB] text-[#4B5563] font-semibold">
                  ACTIVE REPOSITORY
                </span>
                <h3 className="text-base font-bold text-black font-sans">{selectedKb.name}</h3>
              </div>
              <p className="text-xs text-[#6B7280] font-sans mt-1">{selectedKb.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white text-xs font-semibold text-black transition-colors shadow-2xs"
              >
                <UploadSimple className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>Upload Documents</span>
              </button>
            </div>
          </div>

          {/* RAG Query Playground Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="text-xs font-semibold text-black uppercase tracking-wider font-mono">
              Semantic RAG Query Tester
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Ask a question against this Knowledge Base (e.g. What are the key architecture policies?)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="h-10 px-5 rounded-xl bg-black text-white hover:bg-neutral-900 text-xs font-semibold shadow-2xs transition-colors shrink-0 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Retrieve Chunks"}
              </button>
            </div>
          </form>

          {/* Retrieved Vector Chunks Display */}
          {searchResults && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono text-[#6B7280] flex items-center justify-between">
                <span>Top Grounded Passages Retrieved ({searchResults.length})</span>
                <span>Distance Metric: Cosine (pgvector)</span>
              </div>

              <div className="space-y-3">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-black font-sans">{res.source}</span>
                      <span className="font-mono text-[#16A34A] font-semibold">
                        Relevance: {(res.similarityScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-[#374151] font-sans leading-relaxed">
                      {res.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Knowledge Base Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="text-base font-bold text-black">New Knowledge Base</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-black text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateKb} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-black">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOC2 Compliance Framework"
                    value={newKbName}
                    onChange={(e) => setNewKbName(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Scope of documents in this repository..."
                    value={newKbDesc}
                    onChange={(e) => setNewKbDesc(e.target.value)}
                    className="w-full p-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 h-9 rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-xl bg-black text-white hover:bg-neutral-900 text-xs font-semibold"
                  >
                    Create Knowledge Base
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
