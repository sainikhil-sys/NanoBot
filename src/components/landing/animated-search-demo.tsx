"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";

/* ─────────────────────── SEARCH DATASETS ─────────────────────── */

interface SearchResult {
  upvotes: string;
  title: string;
  domain: string;
  tag: string;
  confidence: string;
}

interface SearchQueryScenario {
  query: string;
  results: SearchResult[];
}

const SCENARIOS: SearchQueryScenario[] = [
  {
    query: "How do I fix authentication errors in my React app?",
    results: [
      {
        upvotes: "2.4k",
        title: "JWT Authentication & Session Refresh Guide",
        domain: "developer.mozilla.org",
        tag: "Verified Solution",
        confidence: "AI 97%",
      },
      {
        upvotes: "1.8k",
        title: "Fixing CORS & Axios Interceptors in React 19",
        domain: "github.com/auth-workflow",
        tag: "Code Solution",
        confidence: "AI 94%",
      },
      {
        upvotes: "950",
        title: "Session State & Protected Route Context Patterns",
        domain: "stackoverflow.com",
        tag: "Community Solved",
        confidence: "AI 91%",
      },
      {
        upvotes: "620",
        title: "Secure Cookie vs LocalStorage Token Storage",
        domain: "auth0.com",
        tag: "Architecture",
        confidence: "AI 88%",
      },
    ],
  },
  {
    query: "Explain this Python error and find the root cause",
    results: [
      {
        upvotes: "3.2k",
        title: "CUDA Out of Memory & PyTorch Gradient Cleanup",
        domain: "pytorch.org/docs",
        tag: "Memory Profiler",
        confidence: "AI 98%",
      },
      {
        upvotes: "2.1k",
        title: "Resolving RuntimeError: Event Loop is Closed in FastAPI",
        domain: "fastapi.tiangolo.com",
        tag: "Asyncio Fix",
        confidence: "AI 95%",
      },
      {
        upvotes: "1.4k",
        title: "RecursionLimitExceeded in AST Lexer & Parser Tree",
        domain: "python.org",
        tag: "Stack Analysis",
        confidence: "AI 92%",
      },
      {
        upvotes: "780",
        title: "Cyclic Reference Garbage Collection Bottlenecks",
        domain: "realpython.com",
        tag: "Diagnostic Spec",
        confidence: "AI 89%",
      },
    ],
  },
  {
    query: "Find the best architecture for my AI application",
    results: [
      {
        upvotes: "4.6k",
        title: "Multi-Bot DAG Scheduling & Event Bus Topology",
        domain: "arxiv.org/abs/2403.18901",
        tag: "System Whitepaper",
        confidence: "AI 99%",
      },
      {
        upvotes: "3.1k",
        title: "Low-Latency pgvector RAG with Hybrid Sparse Reranking",
        domain: "supabase.com/docs",
        tag: "Reference Arch",
        confidence: "AI 96%",
      },
      {
        upvotes: "1.9k",
        title: "Streaming SSE Webhooks & Server Actions in Next.js 15",
        domain: "vercel.com/guides",
        tag: "Production Spec",
        confidence: "AI 93%",
      },
      {
        upvotes: "1.2k",
        title: "Deterministic Intent Classification with Confidence Gates",
        domain: "openai.com/research",
        tag: "Best Practice",
        confidence: "AI 90%",
      },
    ],
  },
  {
    query: "How can I optimize this SQL query?",
    results: [
      {
        upvotes: "3.9k",
        title: "Index Scan vs Sequential Scan: EXPLAIN ANALYZE Breakdown",
        domain: "postgresql.org/docs",
        tag: "Query Plan",
        confidence: "AI 97%",
      },
      {
        upvotes: "2.3k",
        title: "Optimizing JSONB GIN Indexes and Composite FKs",
        domain: "supabase.com/guides",
        tag: "Indexing Guide",
        confidence: "AI 94%",
      },
      {
        upvotes: "1.6k",
        title: "Eliminating N+1 Queries in Server Components & DataLoaders",
        domain: "prisma.io/dataguide",
        tag: "Batch Loading",
        confidence: "AI 91%",
      },
      {
        upvotes: "890",
        title: "Connection Pooling with PgBouncer & Read Replicas",
        domain: "pgbouncer.org",
        tag: "Throughput +400%",
        confidence: "AI 88%",
      },
    ],
  },
  {
    query: "Explain this GitHub repository",
    results: [
      {
        upvotes: "5.1k",
        title: "Repository AST Decomposition & Dependency Map",
        domain: "github.com/nanobot-core",
        tag: "Codebase Graph",
        confidence: "AI 99%",
      },
      {
        upvotes: "3.4k",
        title: "Modular Service Boundaries & API Contracts",
        domain: "linear.app/method",
        tag: "Architecture Audit",
        confidence: "AI 95%",
      },
      {
        upvotes: "2.0k",
        title: "Automated Test Matrix Coverage & Cyclomatic Complexity",
        domain: "vitest.dev/guide",
        tag: "Quality Metric",
        confidence: "AI 92%",
      },
      {
        upvotes: "1.3k",
        title: "Docker Multi-Stage Build & Edge Runtime Optimization",
        domain: "docker.com/docs",
        tag: "Deployment Guide",
        confidence: "AI 89%",
      },
    ],
  },
];

/* ─────────────────────── SUBCOMPONENT: RESULT CARD ─────────────────────── */

interface SearchResultCardProps {
  result: SearchResult;
  isActive: boolean;
  index: number;
}

function SearchResultCard({ result, isActive, index }: SearchResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`rounded-xl sm:rounded-2xl border bg-white p-3.5 sm:p-4 transition-all duration-300 flex items-center justify-between gap-3 sm:gap-4 cursor-default ${
        isActive
          ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/15 shadow-sm bg-white"
          : "border-[#EAEAEA] hover:border-[#D5D5D5] shadow-2xs opacity-95"
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
        {/* Upvote score */}
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-neutral-500 bg-[#F5F5F5] border border-[#EAEAEA] rounded-lg px-2 py-1 shrink-0">
          <span>↑</span>
          <span>{result.upvotes}</span>
        </div>

        {/* Title and Domain */}
        <div className="space-y-0.5 min-w-0">
          <h4 className="text-[13px] sm:text-[14px] font-semibold text-black tracking-tight truncate font-sans">
            {result.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] sm:text-[12px] text-neutral-400 font-mono">
            <span className="truncate">{result.domain}</span>
            <span>•</span>
            <span className="text-neutral-500 shrink-0">{result.tag}</span>
          </div>
        </div>
      </div>

      {/* Right side AI confidence score */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          {result.confidence}
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────── MAIN ANIMATED SEARCH DEMO ─────────────────────── */

export function AnimatedSearchDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [typedQuery, setTypedQuery] = useState("");
  const [visibleResultCount, setVisibleResultCount] = useState(0);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  const currentScenario = SCENARIOS[scenarioIndex];

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: NodeJS.Timeout;

    // Phase 1: Type character by character
    const fullText = currentScenario.query;
    let charIndex = 0;
    setTypedQuery("");
    setVisibleResultCount(0);
    setActiveCardIndex(0);
    setIsSearching(false);
    setIsTyping(true);

    const typeNextChar = () => {
      if (isCancelled) return;

      if (charIndex <= fullText.length) {
        setTypedQuery(fullText.slice(0, charIndex));
        charIndex++;
        const jitter = Math.random() * 20;
        timeoutId = setTimeout(typeNextChar, 38 + jitter);
      } else {
        // Typing finished -> brief pause before search begins
        setIsTyping(false);
        setIsSearching(true);

        timeoutId = setTimeout(() => {
          if (isCancelled) return;
          setIsSearching(false);

          // Phase 2: Stagger in result cards
          setVisibleResultCount(1);
          timeoutId = setTimeout(() => {
            if (isCancelled) return;
            setVisibleResultCount(2);
            timeoutId = setTimeout(() => {
              if (isCancelled) return;
              setVisibleResultCount(3);
              timeoutId = setTimeout(() => {
                if (isCancelled) return;
                setVisibleResultCount(4);

                // Phase 3: Traversal of active focus card
                timeoutId = setTimeout(() => {
                  if (isCancelled) return;
                  setActiveCardIndex(1);
                  timeoutId = setTimeout(() => {
                    if (isCancelled) return;
                    setActiveCardIndex(2);
                    timeoutId = setTimeout(() => {
                      if (isCancelled) return;
                      setActiveCardIndex(3);

                      // Phase 4: Hold completed state
                      timeoutId = setTimeout(() => {
                        if (isCancelled) return;
                        // Phase 5: Fade out and transition to next query
                        setVisibleResultCount(0);
                        timeoutId = setTimeout(() => {
                          if (isCancelled) return;
                          setScenarioIndex((prev) => (prev + 1) % SCENARIOS.length);
                        }, 400);
                      }, 3200);
                    }, 1200);
                  }, 1200);
                }, 1200);
              }, 150);
            }, 150);
          }, 150);
        }, 500);
      }
    };

    timeoutId = setTimeout(typeNextChar, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [scenarioIndex]);

  return (
    <section className="py-20 px-6 bg-white relative overflow-hidden" id="search-engine">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Typographic Header matching OQENS visual treatment */}
        <div className="text-center space-y-3.5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-[#EBEBEB] bg-[#FAFAFA] rounded-full px-3.5 py-1 text-xs text-neutral-600 font-mono shadow-2xs">
            <Sparkle weight="bold" className="h-3.5 w-3.5 text-black" />
            <span>Community-Ranked Neural Results</span>
          </div>

          <h2
            className="font-medium tracking-tight text-black font-sans leading-[1.05]"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            The AI search engine <br className="hidden sm:inline" />
            <span className="italic font-serif text-neutral-400 font-normal">
              that works for you.
            </span>
          </h2>

          <p className="text-[15px] sm:text-[16px] text-neutral-500 font-sans max-w-xl mx-auto leading-relaxed">
            Developer-verified solutions, real-time code synthesis, and deterministic neural search — with zero black-box hallucination.
          </p>
        </div>

        {/* Large Rounded Demo Container */}
        <div
          className="max-w-4xl mx-auto rounded-[28px] sm:rounded-[32px] border border-[#EBEBEB] bg-[#F7F7F7] p-5 sm:p-10 relative overflow-hidden shadow-xs"
          style={{
            backgroundImage: "radial-gradient(circle, #D8D8D8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {/* Centered Search Bar */}
          <div className="max-w-[580px] mx-auto bg-white rounded-full border border-[#E5E5E5] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shadow-2xs transition-all focus-within:border-black">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MagnifyingGlass
                weight="bold"
                className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isSearching ? "scale-110 text-black" : ""
                }`}
              />
              <div className="text-[13px] sm:text-[14px] font-sans text-black truncate flex items-center">
                <span>{typedQuery}</span>
                {isTyping && (
                  <span className="animate-cursor-blink text-black font-normal ml-0.5 text-[15px]">
                    |
                  </span>
                )}
                {!isTyping && !typedQuery && (
                  <span className="text-neutral-400 text-[13px]">
                    Search tasks, code, docs, models...
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isSearching ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#EBEBEB] text-[10px] sm:text-[11px] font-mono text-neutral-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" />
                  <span>Searching</span>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded border border-[#EBEBEB] bg-[#FAFAFA] text-[10px] font-mono text-neutral-400">
                  <span>↵</span>
                  <span>Enter</span>
                </div>
              )}
            </div>
          </div>

          {/* Results Stack (Sequential Stagger & Blue Focus Traversal) */}
          <div className="max-w-[580px] mx-auto space-y-2.5 mt-6 min-h-[290px]">
            <AnimatePresence mode="popLayout">
              {visibleResultCount > 0 &&
                currentScenario.results
                  .slice(0, visibleResultCount)
                  .map((result, idx) => (
                    <SearchResultCard
                      key={`${scenarioIndex}-${idx}-${result.title}`}
                      result={result}
                      isActive={activeCardIndex === idx}
                      index={idx}
                    />
                  ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
