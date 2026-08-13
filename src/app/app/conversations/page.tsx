"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Conversation, Message } from "@/types/database.types";
import { AVAILABLE_MODELS, ModelOption } from "@/lib/ai/providers";
import {
  ChatDots,
  PaperPlaneRight,
  Plus,
  Sparkle,
  User,
  Trash,
  ArrowClockwise,
  CaretDown,
  MagnifyingGlass,
  Microphone,
  Paperclip,
  X,
  Copy,
  Check,
  SpeakerHigh,
  FileText,
  Image as ImageIcon,
  BookOpen,
  ArrowUpRight,
  Stop,
  PencilSimple,
  FolderSimple,
} from "@phosphor-icons/react";

/* ─────────────────────── HELPER: SPEECH SYNTHESIS ─────────────────────── */

function speakText(text: string) {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

/* ─────────────────────── HELPER: CODE BLOCK PARSER ─────────────────────── */

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-[#222222] bg-[#0E0E0E] text-white overflow-hidden shadow-xs font-mono text-xs">
      <div className="flex items-center justify-between px-4 py-2 bg-[#171717] border-b border-[#222222]">
        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#22C55E]" />
              <span className="text-[#22C55E]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed text-neutral-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function RenderFormattedMessage({ content, isUser }: { content: string; isUser?: boolean }) {
  // Parse code blocks vs regular markdown text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div
      className={`space-y-2 text-[14px] font-sans leading-relaxed ${
        isUser ? "text-white" : "text-neutral-900"
      }`}
    >
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : "";
          const code = language ? lines.slice(1).join("\n") : lines.join("\n");
          return <CodeBlock key={idx} code={code} language={language} />;
        }

        return (
          <p
            key={idx}
            className={`whitespace-pre-wrap leading-normal ${
              isUser ? "text-white" : "text-neutral-900"
            }`}
          >
            {part}
          </p>
        );
      })}
    </div>
  );
}

/* ─────────────────────── MAIN CONVERSATIONS PAGE ─────────────────────── */

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>(AVAILABLE_MODELS[0]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingToken, setStreamingToken] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<any[]>([]);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingToken]);

  // Fetch list of conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConvId) {
          setActiveConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, [activeConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch active conversation messages
  const fetchMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.conversation?.messages || []);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    }
  }, [activeConvId, fetchMessages]);

  // Create New Chat
  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botId: "chatbot", title: "New Assistant Session" }),
      });
      if (res.ok) {
        const data = await res.json();
        const newConv = data.conversation;
        setConversations((prev) => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  // Delete Conversation
  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        setActiveConvId(remaining.length > 0 ? remaining[0].id : null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  // Handle File Attachment Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + " KB",
            type: file.type,
            extractedText: text ? text.slice(0, 4000) : "Binary file uploaded",
          },
        ]);
      };
      if (file.type.startsWith("image/")) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Handle Voice Input Toggle (Web Speech API)
  const handleVoiceToggle = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser environment.");
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListeningVoice(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInputPrompt(transcript);
    };
    recognition.onerror = () => setIsListeningVoice(false);
    recognition.onend = () => setIsListeningVoice(false);

    recognition.start();
  };

  // Send Message & Stream Response
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() || isGenerating) return;

    setInputPrompt("");
    setIsGenerating(true);
    setStreamingToken("");
    setStreamingCitations([]);

    const currentConvId = activeConvId;

    // Optimistically add user message to UI
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConvId || "",
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: currentConvId,
          content: textToSend,
          modelId: selectedModel.id,
          enableWebSearch,
          attachments,
        }),
      });

      setAttachments([]);

      if (!res.ok || !res.body) {
        throw new Error("Failed to start response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "meta") {
                if (parsed.conversationId && !activeConvId) {
                  setActiveConvId(parsed.conversationId);
                }
                if (parsed.citations) {
                  setStreamingCitations(parsed.citations);
                }
              } else if (parsed.type === "token") {
                accumulatedText += parsed.token;
                setStreamingToken(accumulatedText);
              }
            } catch {
              // Ignore line parse errors
            }
          }
        }
      }

      // Add assistant message upon completion
      if (accumulatedText) {
        const tempAssistantMsg: Message = {
          id: `temp-assistant-${Date.now()}`,
          conversation_id: currentConvId || "",
          role: "assistant",
          content: accumulatedText,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempAssistantMsg]);
      }
    } catch (err) {
      console.error("Streaming error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversation_id: currentConvId || "",
          role: "assistant",
          content: "An error occurred while generating the response. Please check your connection and try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
      setStreamingToken("");
      fetchConversations();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    (c.title || "Untitled").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#FBFBFB] overflow-hidden font-sans text-neutral-900">
      {/* ─────────────────────── LEFT SIDEBAR ─────────────────────── */}
      <aside className="w-80 border-r border-[#EBEBEB] bg-white flex flex-col justify-between shrink-0 hidden md:flex">
        {/* Top Header & New Chat */}
        <div className="p-4 space-y-3 border-b border-[#F0F0F0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                N
              </div>
              <span className="font-bold text-black tracking-tight text-base">
                NanoBot Assistant
              </span>
            </div>
            <Link
              href="/app/projects"
              className="p-1.5 rounded-lg border border-[#EBEBEB] text-neutral-400 hover:text-black hover:bg-[#FAFAFA] transition-colors"
              title="Projects & Workspaces"
            >
              <FolderSimple className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className="w-full h-10 rounded-2xl bg-black text-white hover:bg-[#1A1A1A] font-medium text-xs tracking-tight flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>New Assistant Chat</span>
          </button>

          {/* Conversation Search Filter */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-[#FAFAFA] border border-[#EBEBEB] rounded-xl text-xs font-sans text-black focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-2 py-1 text-[10px] font-mono uppercase text-neutral-400 font-semibold tracking-wider">
            Recent Conversations
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400 font-sans">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConvId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? "bg-[#F5F5F5] font-semibold text-black border border-[#EAEAEA]"
                      : "text-neutral-600 hover:bg-[#FAFAFA] hover:text-black"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-6">
                    <ChatDots className="h-4 w-4 text-neutral-400 shrink-0" />
                    <span className="truncate">{c.title || "Untitled Session"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteChat(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 rounded transition-opacity"
                    title="Delete Chat"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#F0F0F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-neutral-100 border border-[#EBEBEB] flex items-center justify-center font-bold text-xs">
              U
            </div>
            <div className="text-xs font-medium text-black truncate">
              User Workspace
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            <span>Online</span>
          </div>
        </div>
      </aside>

      {/* ─────────────────────── MAIN CHAT CANVAS ─────────────────────── */}
      <main className="flex-1 flex flex-col justify-between bg-white relative overflow-hidden">
        {/* Header Bar: Model Selector & Actions */}
        <header className="h-14 border-b border-[#EBEBEB] bg-white px-6 flex items-center justify-between shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-semibold text-black transition-all shadow-2xs"
              >
                <Sparkle weight="bold" className="h-3.5 w-3.5 text-black" />
                <span>{selectedModel.name}</span>
                <CaretDown className="h-3 w-3 text-neutral-400" />
              </button>

              {modelDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-[#EAEAEA] rounded-2xl p-2 shadow-lg z-30 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-neutral-400 font-semibold">
                    Select Neural Model
                  </div>
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(m);
                        setModelDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex flex-col gap-0.5 transition-colors ${
                        selectedModel.id === m.id
                          ? "bg-black text-white font-medium"
                          : "hover:bg-[#FAFAFA] text-neutral-800"
                      }`}
                    >
                      <span className="font-semibold">{m.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {m.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Web Search Toggle Chip */}
            <button
              type="button"
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans transition-all border ${
                enableWebSearch
                  ? "bg-blue-50 text-[#3B82F6] border-blue-300 font-medium"
                  : "bg-white text-neutral-500 border-[#E5E5E5] hover:text-black"
              }`}
            >
              <MagnifyingGlass weight="bold" className="h-3.5 w-3.5" />
              <span>Search Web</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="p-2 text-neutral-400 hover:text-black rounded-xl hover:bg-[#FAFAFA] transition-colors"
              title="New Chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Message Stream Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {messages.length === 0 && !isGenerating ? (
            /* OQENS / ChatGPT Welcome Empty State */
            <div className="py-16 text-center space-y-8 max-w-xl mx-auto">
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl mx-auto shadow-xs">
                  N
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black font-sans">
                  What can I help you with today?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
                  NanoBot synthesizes code, document reasoning, web research, and workflow execution into a single unified assistant.
                </p>
              </div>

              {/* 4 Shortcut Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage("Find the latest research papers on multi-agent DAG orchestration")
                  }
                  className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black transition-all shadow-2xs space-y-1.5 group"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-black">
                    <MagnifyingGlass className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                    <span>Research AI Trends</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans line-clamp-2">
                    Search web & academic papers for recent multi-agent topologies.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage("How do I fix authentication errors and JWT session refresh in React?")
                  }
                  className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black transition-all shadow-2xs space-y-1.5 group"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-black">
                    <Sparkle className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                    <span>Refactor & Debug Code</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans line-clamp-2">
                    Diagnose stack traces, CORS errors, or write TypeScript components.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage("Compare PostgreSQL pgvector vs MongoDB Atlas Vector Search")
                  }
                  className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black transition-all shadow-2xs space-y-1.5 group"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-black">
                    <FileText className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                    <span>Architectural Benchmark</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans line-clamp-2">
                    Compare database tradeoffs, latency, and vector similarity performance.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage("Explain the architecture of a production multi-bot DAG pipeline")
                  }
                  className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black transition-all shadow-2xs space-y-1.5 group"
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-black">
                    <BookOpen className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                    <span>Explain Complex Concept</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 font-sans line-clamp-2">
                    Deconstruct system architecture and distributed memory boundaries.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Render Message History */
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-4 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    N
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-5 space-y-3 ${
                    m.role === "user"
                      ? "bg-black text-white"
                      : "bg-[#FAFAFA] border border-[#EBEBEB] text-black shadow-2xs"
                  }`}
                >
                  <RenderFormattedMessage content={m.content} isUser={m.role === "user"} />

                  {/* Message Action Bar for Assistant */}
                  {m.role === "assistant" && (
                    <div className="pt-2 border-t border-[#F0F0F0] flex items-center gap-3 text-neutral-400 text-xs">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(m.content)}
                        className="hover:text-black transition-colors flex items-center gap-1"
                        title="Copy Response"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => speakText(m.content)}
                        className="hover:text-black transition-colors flex items-center gap-1"
                        title="Read Aloud"
                      >
                        <SpeakerHigh className="h-3.5 w-3.5" />
                        <span>Speak</span>
                      </button>
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-neutral-200 text-black flex items-center justify-center font-bold text-xs shrink-0">
                    U
                  </div>
                )}
              </div>
            ))
          )}

          {/* Streaming Live Token Output */}
          {isGenerating && streamingToken && (
            <div className="flex gap-4 justify-start">
              <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                N
              </div>

              <div className="max-w-[85%] rounded-3xl p-5 bg-[#FAFAFA] border border-[#EBEBEB] text-black shadow-2xs space-y-3">
                {/* Streaming Citations Box if available */}
                {streamingCitations.length > 0 && (
                  <div className="p-3 rounded-xl bg-white border border-[#EAEAEA] space-y-2 text-xs font-sans">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase text-neutral-400 font-semibold">
                      <MagnifyingGlass className="h-3.5 w-3.5 text-[#3B82F6]" />
                      <span>Web Sources Cited ({streamingCitations.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {streamingCitations.map((c, i) => (
                        <a
                          key={i}
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-[#EBEBEB] text-[11px] font-mono text-neutral-700 hover:border-black transition-colors"
                        >
                          <span className="font-semibold text-black">[{i + 1}]</span>
                          <span className="truncate max-w-[120px]">{c.domain}</span>
                          <ArrowUpRight className="h-3 w-3 text-neutral-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <RenderFormattedMessage content={streamingToken} />
                <span className="animate-pulse font-bold text-black ml-0.5">▍</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Composer Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#EBEBEB] shrink-0 z-20">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Attachment Preview Pills */}
            {attachments.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pb-1">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#FAFAFA] border border-[#EBEBEB] text-xs font-mono text-neutral-700"
                  >
                    <FileText className="h-3.5 w-3.5 text-black" />
                    <span className="truncate max-w-[140px]">{att.name}</span>
                    <span className="text-[10px] text-neutral-400">({att.size})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="text-neutral-400 hover:text-black ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer Input Box */}
            <div className="bg-white rounded-3xl border border-[#E5E5E5] p-3 sm:p-4 shadow-xs focus-within:border-black transition-all space-y-3">
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask NanoBot anything, search web, debug code, analyze files..."
                rows={2}
                className="w-full bg-transparent text-sm font-sans text-black focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 border-t border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  {/* File Upload Trigger */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-neutral-400 hover:text-black hover:bg-[#FAFAFA] transition-colors"
                    title="Upload File / Image"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  {/* Voice Mic Input Toggle */}
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    className={`p-2 rounded-xl transition-colors ${
                      isListeningVoice
                        ? "bg-blue-50 text-[#3B82F6] ring-1 ring-blue-300"
                        : "text-neutral-400 hover:text-black hover:bg-[#FAFAFA]"
                    }`}
                    title="Voice Input (Speech-to-text)"
                  >
                    <Microphone
                      weight={isListeningVoice ? "fill" : "regular"}
                      className="h-4 w-4"
                    />
                  </button>

                  {/* Web Search mode indicator pill */}
                  <button
                    type="button"
                    onClick={() => setEnableWebSearch(!enableWebSearch)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-sans transition-colors ${
                      enableWebSearch
                        ? "bg-blue-50 text-[#3B82F6] font-medium"
                        : "text-neutral-400 hover:text-black"
                    }`}
                  >
                    <MagnifyingGlass className="h-3.5 w-3.5" />
                    <span>Web Search</span>
                  </button>
                </div>

                {/* Send or Stop Generation Button */}
                {isGenerating ? (
                  <button
                    type="button"
                    onClick={() => setIsGenerating(false)}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-red-600 text-white font-medium text-xs shadow-xs hover:bg-red-700 transition-colors"
                  >
                    <Stop weight="bold" className="h-3.5 w-3.5" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputPrompt.trim()}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-black text-white font-medium text-xs shadow-xs hover:bg-[#1A1A1A] disabled:opacity-40 transition-all"
                  >
                    <span>Send</span>
                    <PaperPlaneRight weight="bold" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
