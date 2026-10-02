"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  Brain,
  Plus,
  Trash,
  Sparkle,
  CheckCircle,
  Tag,
  ShieldCheck,
  Funnel,
} from "@phosphor-icons/react";
import { PersonalMemory, MemoryCategory } from "@/types/database.types";

export default function MemoryPage() {
  const [memories, setMemories] = useState<PersonalMemory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // Form State
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("preferences");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/personal-memory");
      const json = await res.json();
      if (json.success) {
        setMemories(json.memories || []);
      }
    } catch (err) {
      console.error("Failed to fetch memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    try {
      const res = await fetch("/api/personal-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          value: newValue.trim(),
          category: newCategory,
        }),
      });
      const json = await res.json();
      if (json.success && json.memory) {
        setMemories((prev) => [json.memory, ...prev]);
        setCreateModalOpen(false);
        setNewKey("");
        setNewValue("");
        setToastMessage(`Saved memory "${json.memory.key}"!`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save memory:", err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch(`/api/personal-memory?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete memory:", err);
      fetchMemories();
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all personal memories? This action cannot be undone.")) {
      return;
    }
    try {
      await fetch("/api/personal-memory?action=clearAll", { method: "DELETE" });
      setMemories([]);
      setToastMessage("All personal memories cleared.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to clear memories:", err);
    }
  };

  const filteredMemories = memories.filter((m) => {
    if (selectedCategory === "ALL") return true;
    return m.category === selectedCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="Personal Memory & Context Engine"
        subtitle="Persistent structured facts, preferences, project context, and communication styles grounding your AI assistant."
        actions={
          <div className="flex items-center gap-2">
            {memories.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium transition"
              >
                Clear All Memory
              </button>
            )}
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
              <span>Add Memory</span>
            </button>
          </div>
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Privacy & Safety Note */}
        <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-xs text-neutral-400 leading-relaxed">
            Personal memories are stored encrypted in PostgreSQL with strict RLS tenant isolation.
            NanoBot never silently infers sensitive personal characteristics. You have full ownership to view, edit, or delete any item at any time.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "ALL", label: "All Memories" },
            { id: "preferences", label: "Preferences" },
            { id: "projects", label: "Projects" },
            { id: "people", label: "People & Team" },
            { id: "meetings", label: "Meetings" },
            { id: "communication_style", label: "Communication Style" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium transition shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-white text-neutral-950 border-white font-semibold"
                  : "bg-neutral-900/70 text-neutral-400 border-neutral-800 hover:text-neutral-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Memory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full p-12 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
              <Brain className="w-8 h-8 text-neutral-400 mx-auto" />
              <p>No personal memories stored under this category yet.</p>
              <p className="text-[11px] text-neutral-500">
                You can say &quot;Remember that I prefer meetings after 10 AM&quot; in chat to store memories naturally!
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 uppercase font-mono">
                      {mem.category.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="text-neutral-500 hover:text-rose-400 transition"
                      title="Delete memory"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-neutral-100">{mem.key}</h4>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{mem.value}</p>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500 font-mono pt-2 border-t border-neutral-800/80">
                  Confidence: {Math.round(mem.confidence * 100)}% • Grounded in AI
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Memory Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateMemory}
              className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  Add Personal Fact / Preference
                </h3>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1 font-mono text-[11px]">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-200 text-xs"
                  >
                    <option value="preferences">Preferences (Meetings, Work Hours)</option>
                    <option value="projects">Projects (Active Roadmap, Milestones)</option>
                    <option value="people">People (Collaborators, Team, Clients)</option>
                    <option value="communication_style">Communication Style (Concise, Formal)</option>
                    <option value="important_dates">Important Dates (Deadlines, Launches)</option>
                  </select>
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Concept Identifier *:</label>
                  <input
                    required
                    placeholder="e.g. Preferred Meeting Hours, Current AI Project"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-hidden focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Memory Detail *:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. I prefer all sync meetings to be scheduled after 10:00 AM."
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs leading-relaxed focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
                >
                  Save to Memory
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
