"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatComposer } from "./chat-composer";
import { TaskRoutingIndicator, TaskRoutingState } from "./task-routing-indicator";
import { DeepLearningInspector, DeepLearningMetrics } from "./deep-learning-inspector";
import { MarkdownMessage } from "./markdown-message";
import { PowerfulFeatures } from "../dashboard/powerful-features";
import {
  Globe,
  Plus,
  Copy,
  Check,
  ArrowSquareOut,
  Cpu,
} from "@phosphor-icons/react";

export interface WorkspaceMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  botId?: string;
  botName?: string;
  routing?: TaskRoutingState;
  metrics?: DeepLearningMetrics;
  sources?: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
  timestamp: string;
}

export function UniversalChatWorkspace() {
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedBotId, setSelectedBotId] = useState("auto");
  const [isStreaming, setIsStreaming] = useState(false);
  const [technicalView, setTechnicalView] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Active streaming state
  const [streamingContent, setStreamingContent] = useState("");
  const [currentRouting, setCurrentRouting] = useState<TaskRoutingState | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<DeepLearningMetrics | null>(null);
  const [currentSources, setCurrentSources] = useState<any[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 160;
  };

  const scrollToBottom = (force = false) => {
    if (force || isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, currentRouting]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = async (promptText: string, botId: string, webSearch: boolean) => {
    if (!promptText.trim() || isStreaming) return;

    const userMessage: WorkspaceMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: promptText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);
    setStreamingContent("");
    setCurrentSources([]);
    setCurrentMetrics(null);

    // Initial Routing State
    setCurrentRouting({
      botId: botId === "auto" ? "auto" : botId,
      botName: "NanoBot",
      isRouting: true,
    });

    // Force scroll on new user message
    setTimeout(() => scrollToBottom(true), 50);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: promptText.trim(),
          conversationId,
          botId,
          webSearch,
        }),
        signal: abortController.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Chat API error: HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";
      let finalRouting: TaskRoutingState | null = null;
      let finalMetrics: DeepLearningMetrics | null = null;
      let finalSources: any[] = [];
      let retrievedChunks: any[] = [];
      let isCompleted = false;
      let hasError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              try {
                const ev = JSON.parse(trimmed.slice(6));

                if (ev.type === "message_start") {
                  if (ev.conversationId) {
                    setConversationId(ev.conversationId);
                  }
                } else if (ev.type === "routing") {
                  finalRouting = {
                    botId: ev.botId,
                    botName: ev.botName,
                    category: ev.category,
                    confidence: ev.confidence,
                    reason: ev.reason,
                    tools: ev.tools,
                    isRouting: false,
                  };
                  setCurrentRouting(finalRouting);
                } else if (ev.type === "status") {
                  setCurrentRouting((prev) =>
                    prev ? { ...prev, statusMessage: ev.message } : null
                  );
                } else if (ev.type === "retrieval_completed") {
                  retrievedChunks = ev.chunks || [];
                } else if (ev.type === "sources") {
                  finalSources = ev.sources || [];
                  setCurrentSources(finalSources);
                } else if (ev.type === "token") {
                  accumulatedText += ev.content;
                  setStreamingContent(accumulatedText);
                } else if (ev.type === "metrics") {
                  finalMetrics = {
                    ...ev.metrics,
                    retrievedChunks,
                  };
                  setCurrentMetrics(finalMetrics);
                } else if (ev.type === "error") {
                  hasError = true;
                  const errorMessage: WorkspaceMessage = {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: ev.message || "Sorry, I couldn't generate a response right now. Please try again.",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  };
                  setMessages((prev) => [...prev, errorMessage]);
                } else if (ev.type === "complete") {
                  isCompleted = true;
                  const assistantMessage: WorkspaceMessage = {
                    id: `asst-${Date.now()}`,
                    role: "assistant",
                    content: accumulatedText,
                    botId: finalRouting?.botId || "auto",
                    botName: "NanoBot",
                    routing: finalRouting || undefined,
                    metrics: finalMetrics || undefined,
                    sources: finalSources.length > 0 ? finalSources : undefined,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  };

                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingContent("");
                  setCurrentRouting(null);
                  setCurrentMetrics(null);
                  setCurrentSources([]);
                }
              } catch (pErr) {
                console.warn("SSE chunk parse warning:", pErr);
              }
            }
          }
        }
      }

      // If stream ended cleanly without explicit 'complete' or 'error' event
      if (!isCompleted && !hasError && accumulatedText.trim()) {
        const assistantMessage: WorkspaceMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: accumulatedText,
          botId: finalRouting?.botId || "auto",
          botName: "NanoBot",
          routing: finalRouting || undefined,
          metrics: finalMetrics || undefined,
          sources: finalSources.length > 0 ? finalSources : undefined,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (!isCompleted && !hasError && !accumulatedText.trim()) {
        const errorMessage: WorkspaceMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't generate a response right now. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat streaming aborted by user");
      } else {
        console.error("Chat error:", err);
        const errorMessage: WorkspaceMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't generate a response right now. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      setCurrentRouting(null);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleNewChat = () => {
    handleStop();
    setMessages([]);
    setConversationId(null);
    setStreamingContent("");
    setCurrentRouting(null);
    setCurrentMetrics(null);
    setCurrentSources([]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full bg-white font-sans overflow-hidden">
      {/* 1. INITIAL LANDING / DASHBOARD STATE (when no messages yet) */}
      {messages.length === 0 && !isStreaming ? (
        <div className="flex-1 min-h-0 overflow-y-auto py-8 sm:py-10 space-y-10 flex flex-col w-full max-w-[1150px] mx-auto px-4 sm:px-8 animate-fadeIn">
          {/* Main Dashboard Hero */}
          <div className="flex flex-col items-center text-center space-y-6 pt-4 pb-2 max-w-4xl mx-auto w-full">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAFAFA] border border-[#E5E7EB] text-xs font-mono text-[#6B7280] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="font-semibold text-black">AI Search Ready</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-2.5">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-black font-sans">
                Search Smarter with <span className="text-[#16A34A]">Nanobot</span>
              </h1>
              <p className="text-sm sm:text-base text-[#6B7280] font-sans max-w-2xl mx-auto leading-relaxed">
                Get real-time answers, upload files, convert documents, and automate with AI.
              </p>
            </div>

            {/* Central Main Composer */}
            <div className="w-full max-w-[950px] text-left pt-2">
              <ChatComposer
                onSend={handleSendMessage}
                onStop={handleStop}
                isStreaming={isStreaming}
                selectedBotId={selectedBotId}
                onSelectBot={setSelectedBotId}
              />
            </div>
          </div>

          {/* Powerful Features 3-Column Grid */}
          <div className="w-full pb-12">
            <PowerfulFeatures />
          </div>
        </div>
      ) : (
        /* 2. ACTIVE CONVERSATIONAL WORKSPACE (Full-width shell with aligned ~1150px readable conversation column) */
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
          {/* Top Workspace Header Bar */}
          <div className="w-full border-b border-[#E5E7EB] bg-white shrink-0">
            <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-black text-white flex items-center justify-center font-mono text-xs font-bold shadow-2xs">
                  N
                </div>
                <span className="text-sm font-bold text-black font-sans">
                  NanoBot Workspace
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Optional Developer Technical View Toggle */}
                <button
                  type="button"
                  onClick={() => setTechnicalView(!technicalView)}
                  className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-mono transition-colors shadow-2xs ${
                    technicalView
                      ? "bg-black text-white border-black"
                      : "bg-white border-[#E5E7EB] text-[#6B7280] hover:text-black hover:bg-neutral-50"
                  }`}
                  title="Toggle Developer Technical View"
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Technical View</span>
                </button>

                <button
                  type="button"
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-medium text-black transition-colors shadow-2xs"
                >
                  <Plus weight="bold" className="h-3 w-3" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Conversation Viewport */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto py-6 space-y-6 scroll-smooth"
          >
            <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-8 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1.5 ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Message Author & Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] font-sans px-1">
                    <span className="font-semibold text-black">
                      {msg.role === "user" ? "You" : "NanoBot"}
                    </span>
                    <span>·</span>
                    <span className="text-[11px] font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  {msg.role === "user" ? (
                    /* User Bubble: Pure solid black with explicit white text */
                    <div
                      className="p-4 rounded-2xl rounded-tr-xs bg-black text-white max-w-2xl sm:max-w-3xl shadow-xs break-words font-sans text-[14px] leading-relaxed selection:bg-neutral-800"
                      style={{ backgroundColor: "#000000", color: "#FFFFFF" }}
                    >
                      <div className="text-white whitespace-pre-wrap select-text" style={{ color: "#FFFFFF" }}>
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Bubble: Clean white card with formatted Markdown */
                    <div className="p-5 sm:p-6 rounded-2xl rounded-tl-xs bg-white border border-[#E5E7EB] text-black w-full max-w-4xl space-y-3.5 shadow-2xs">
                      {/* Technical View Details if enabled */}
                      {msg.routing && technicalView && (
                        <TaskRoutingIndicator routing={msg.routing} technicalView={true} />
                      )}

                      {/* Message Markdown Content */}
                      <MarkdownMessage content={msg.content} />

                      {/* Grounded Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                          <div className="text-[11px] font-mono uppercase text-[#6B7280] font-semibold flex items-center gap-1.5">
                            <Globe weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
                            <span>Grounded Sources ({msg.sources.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((s, idx) => (
                              <a
                                key={idx}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-neutral-100 hover:border-black/30 transition-colors group"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-semibold text-black truncate group-hover:text-[#16A34A]">
                                    {s.title}
                                  </div>
                                  <div className="text-[10px] font-mono text-[#6B7280] truncate">
                                    {s.domain}
                                  </div>
                                </div>
                                <ArrowSquareOut className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deep Learning Telemetry Inspector in Technical View */}
                      {msg.metrics && technicalView && (
                        <div className="pt-2 border-t border-[#E5E7EB]">
                          <DeepLearningInspector metrics={msg.metrics} />
                        </div>
                      )}

                      {/* Bottom Actions for Assistant Message */}
                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#6B7280] hover:text-black transition-colors"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="h-3 w-3 text-[#16A34A]" />
                              <span className="text-[#16A34A]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Live Streaming Assistant Message */}
              {isStreaming && (
                <div className="flex flex-col items-start space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] font-sans px-1">
                    <span className="font-semibold text-black">NanoBot</span>
                    <span>·</span>
                    <span className="text-[11px] font-mono">Generating...</span>
                  </div>

                  <div className="p-5 sm:p-6 rounded-2xl rounded-tl-xs bg-white border border-[#E5E7EB] text-black w-full max-w-4xl space-y-3.5 shadow-2xs">
                    {/* Subtle operational status message */}
                    {currentRouting && (
                      <TaskRoutingIndicator routing={currentRouting} technicalView={technicalView} />
                    )}

                    {/* Streaming Markdown Text */}
                    <div className="text-[14px] leading-relaxed">
                      <MarkdownMessage content={streamingContent} />
                      <span className="inline-block w-2 h-4 bg-[#16A34A] animate-pulse ml-0.5 align-middle" />
                    </div>

                    {/* Live Sources */}
                    {currentSources.length > 0 && (
                      <div className="pt-3 border-t border-[#E5E7EB] space-y-2">
                        <div className="text-[11px] font-mono uppercase text-[#6B7280] font-semibold flex items-center gap-1.5">
                          <Globe weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
                          <span>Sources Retrieved ({currentSources.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {currentSources.map((s, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs font-semibold text-black truncate">{s.title}</div>
                                <div className="text-[10px] font-mono text-[#6B7280] truncate">{s.domain}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Telemetry Inspector in Technical View */}
                    {currentMetrics && technicalView && (
                      <div className="pt-2 border-t border-[#E5E7EB]">
                        <DeepLearningInspector metrics={currentMetrics} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Non-overlapping Aligned Bottom Composer Container */}
          <div className="border-t border-[#E5E7EB] bg-white py-3 sm:py-4 shrink-0">
            <div className="w-full max-w-[1150px] mx-auto px-4 sm:px-8">
              <ChatComposer
                onSend={handleSendMessage}
                onStop={handleStop}
                isStreaming={isStreaming}
                selectedBotId={selectedBotId}
                onSelectBot={setSelectedBotId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
