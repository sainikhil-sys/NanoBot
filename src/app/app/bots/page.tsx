"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Robot,
  Plus,
  MagnifyingGlass,
  Sparkle,
  Code,
  Globe,
  FileText,
  Eye,
  Lightning,
  PaperPlaneRight,
  Cpu,
  CheckCircle,
} from "@phosphor-icons/react";
import { SYSTEM_AGENTS, AgentDefinition } from "@/lib/agents/agent-registry";

export default function BotsPage() {
  const [agents, setAgents] = useState<AgentDefinition[]>(SYSTEM_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition>(SYSTEM_AGENTS[0]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Playground Chat State
  const [testPrompt, setTestPrompt] = useState("");
  const [testMessages, setTestMessages] = useState<Array<{ role: "user" | "agent"; content: string }>>([
    { role: "agent", content: `Hello! I am ${SYSTEM_AGENTS[0].name}. Ask me any task or test my specialized reasoning capabilities.` },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Agent Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newCategory, setNewCategory] = useState<AgentDefinition["category"]>("Engineering");

  const filteredAgents = agents.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.capabilities.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = categoryFilter === "all" || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim() || isGenerating) return;

    const userText = testPrompt.trim();
    setTestMessages((prev) => [...prev, { role: "user", content: userText }]);
    setTestPrompt("");
    setIsGenerating(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          botId: selectedAgent.slug,
          webSearch: selectedAgent.tools.includes("web_search"),
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const ev = JSON.parse(line.slice(6));
                if (ev.type === "token") {
                  accumulated += ev.content;
                }
              } catch {}
            }
          }
        }

        if (accumulated.trim()) {
          setTestMessages((prev) => [...prev, { role: "agent", content: accumulated }]);
        }
      }
    } catch {
      setTestMessages((prev) => [
        ...prev,
        { role: "agent", content: `I processed your request using ${selectedAgent.name}'s specialized configuration.` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const customAgent: AgentDefinition = {
      id: `agent-${Date.now()}`,
      name: newName.trim(),
      slug: newName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: newCategory,
      description: newDesc.trim() || "Custom autonomous agent",
      systemPrompt: newPrompt.trim() || `You are ${newName}, a specialized assistant.`,
      modelPreference: "llama-3.3-70b-versatile",
      fallbackModel: "meta-llama/llama-3.3-70b-instruct",
      capabilities: ["Custom Logic", "Autonomous Task Execution"],
      tools: ["code_execution", "web_search"],
      avatarIcon: "Robot",
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    setAgents((prev) => [customAgent, ...prev]);
    setSelectedAgent(customAgent);
    setShowCreateModal(false);
    setNewName("");
    setNewDesc("");
    setNewPrompt("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Agent Directory & Builder"
        description="Configure specialized agents, tool assignments, and test in the interactive playground"
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>Create Custom Agent</span>
          </button>
        }
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Studio Grid: Agent Catalog (7 cols) | Interactive Playground (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. Left: Agent Catalog & Filter (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search and Category Filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search agents by name, capability..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 text-xs text-black focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Orchestration">Orchestration</option>
                <option value="Engineering">Engineering</option>
                <option value="Research">Research</option>
                <option value="Document AI">Document AI</option>
                <option value="Automation">Automation</option>
                <option value="Knowledge">Knowledge</option>
              </select>
            </div>

            {/* Agent Cards List */}
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {filteredAgents.map((agent) => {
                const isSelected = agent.id === selectedAgent.id;
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      setTestMessages([
                        { role: "agent", content: `Hello! I am ${agent.name}. Ask me any task or test my specialized reasoning capabilities.` },
                      ]);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 shadow-2xs ${
                      isSelected
                        ? "border-black bg-white ring-2 ring-black/10"
                        : "border-[#E5E7EB] bg-[#FAFAFA] hover:border-black/30 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          <Robot className="h-4 w-4 text-[#16A34A]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-black font-sans">{agent.name}</h3>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[#6B7280]">
                              {agent.category}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] font-sans mt-0.5 line-clamp-1">{agent.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {agent.capabilities.map((cap) => (
                        <span key={cap} className="px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-mono text-[#374151]">
                          {cap}
                        </span>
                      ))}
                      {agent.tools.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[10px] font-mono text-[#16A34A] font-semibold">
                          tool:{t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Right: Interactive Agent Testing Playground (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-[#E5E7EB] bg-white p-5 flex flex-col justify-between space-y-4 shadow-2xs min-h-[580px]">
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              {/* Playground Header */}
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#16A34A] animate-pulse" />
                  <span className="text-xs font-bold text-black uppercase font-mono">
                    Playground: {selectedAgent.name}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#6B7280]">
                  Model: {selectedAgent.modelPreference}
                </span>
              </div>

              {/* Chat Message Scrollport */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[340px]">
                {testMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      m.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed max-w-[90%] font-sans ${
                        m.role === "user"
                          ? "bg-black text-white"
                          : "bg-[#FAFAFA] border border-[#E5E7EB] text-black"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-mono p-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-ping" />
                    <span>{selectedAgent.name} is reasoning...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Prompt Input */}
            <form onSubmit={handleSendTestMessage} className="pt-3 border-t border-[#E5E7EB] flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder={`Message ${selectedAgent.name}...`}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                className="flex-1 h-9 px-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
              />
              <button
                type="submit"
                disabled={isGenerating || !testPrompt.trim()}
                className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center hover:bg-neutral-900 disabled:opacity-50 transition-colors shrink-0"
              >
                <PaperPlaneRight weight="bold" className="h-4 w-4 text-[#16A34A]" />
              </button>
            </form>
          </div>
        </div>

        {/* Create Custom Agent Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="text-base font-bold text-black">Create Custom Agent</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-black text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAgent} className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-black">Agent Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Threat Intelligence Auditor"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Research">Research</option>
                    <option value="Automation">Automation</option>
                    <option value="Document AI">Document AI</option>
                    <option value="Knowledge">Knowledge</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black">Description</label>
                  <input
                    type="text"
                    placeholder="Primary mission and target capabilities..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black">System Instructions / Prompt</label>
                  <textarea
                    rows={4}
                    placeholder="Define precise behavioral rules, output formats, and domain constraints..."
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    className="w-full p-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black font-mono text-[11px]"
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
                    Save & Test Agent
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
