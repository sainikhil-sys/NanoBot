"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  CheckSquare,
  Square,
  Plus,
  Trash,
  Clock,
  Tag,
  ArrowsClockwise,
  Sparkle,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import { PersonalTask, PersonalTaskPriority } from "@/types/database.types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [extractModalOpen, setExtractModalOpen] = useState<boolean>(false);
  const [extractInput, setExtractInput] = useState<string>("");

  // Create form state
  const [newTitle, setNewTitle] = useState<string>("");
  const [newPriority, setNewPriority] = useState<PersonalTaskPriority>("medium");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Personal");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/personal-tasks");
      const json = await res.json();
      if (json.success) {
        setTasks(json.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleComplete = async (task: PersonalTask) => {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await fetch("/api/personal-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
    } catch (err) {
      console.error("Failed to toggle task status:", err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/personal-tasks?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task:", err);
      fetchTasks();
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/personal-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          priority: newPriority,
          dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
          category: newCategory,
        }),
      });
      const json = await res.json();
      if (json.success && json.task) {
        setTasks((prev) => [json.task, ...prev]);
        setCreateModalOpen(false);
        setNewTitle("");
        setNewDueDate("");
        setToastMessage(`Task "${json.task.title}" created!`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  const handleExtractTasks = async () => {
    if (!extractInput.trim()) return;
    try {
      const res = await fetch("/api/personal-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extract",
          text: extractInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchTasks();
        setExtractModalOpen(false);
        setExtractInput("");
        setToastMessage(`Extracted and created ${json.createdCount || 0} task(s)!`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to extract tasks:", err);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const getPriorityBadge = (priority: PersonalTaskPriority) => {
    switch (priority) {
      case "urgent":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/70 text-rose-300 border border-rose-500/30">URGENT</span>;
      case "high":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30">HIGH</span>;
      case "medium":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/70 text-indigo-300 border border-indigo-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">LOW</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="Personal Tasks & Action Items"
        subtitle="AI-prioritized personal task tracker with smart due date extraction and email action grounding."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExtractModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition"
            >
              <Sparkle className="w-3.5 h-3.5 text-amber-400" />
              <span>Extract from Text</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" weight="bold" />
              <span>New Task</span>
            </button>
          </div>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Pending Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              Pending Tasks ({pendingTasks.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <p>All tasks are completed! Enjoy your day or add new items above.</p>
              </div>
            ) : (
              pendingTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="text-neutral-500 hover:text-emerald-400 transition shrink-0"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-semibold text-neutral-100 truncate">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-neutral-400 truncate">{task.description}</div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 pt-0.5">
                          {task.due_date && (
                            <span className={`flex items-center gap-1 font-mono ${isOverdue ? "text-rose-400 font-semibold" : ""}`}>
                              <Clock className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                              {isOverdue && " (Overdue)"}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-neutral-500" />
                            {task.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getPriorityBadge(task.priority)}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 transition"
                        title="Delete task"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-neutral-800/80">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase font-mono tracking-wider">
              Completed ({completedTasks.length})
            </h3>
            <div className="space-y-2 opacity-60">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="text-emerald-400 transition shrink-0"
                    >
                      <CheckSquare className="w-5 h-5" weight="fill" />
                    </button>
                    <span className="text-xs text-neutral-400 line-through truncate">{task.title}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 transition"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateTask}
              className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Add Personal Task
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
                  <label className="text-neutral-300 block mb-1 font-semibold">Task Title *:</label>
                  <input
                    required
                    placeholder="e.g. Follow up with the investor regarding proposal"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs focus:outline-hidden focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1 font-mono text-[11px]">Priority:</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-200 text-xs"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-neutral-400 block mb-1 font-mono text-[11px]">Category:</label>
                    <input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Personal, Work, Email"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-mono text-[11px]">Due Date (Optional):</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs"
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
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* AI Task Extraction Modal */}
        {extractModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <Sparkle className="w-4 h-4 text-amber-400" />
                  AI Task Auto-Extractor
                </h3>
                <button
                  onClick={() => setExtractModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Paste email threads, meeting notes, or raw text below. NanoBot will extract action items, estimate priorities, and schedule due dates.
                </p>
                <textarea
                  rows={6}
                  placeholder="Paste meeting notes or email snippet..."
                  value={extractInput}
                  onChange={(e) => setExtractInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs leading-relaxed focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setExtractModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtractTasks}
                  disabled={!extractInput.trim()}
                  className="px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition flex items-center gap-2"
                >
                  <Sparkle className="w-3.5 h-3.5 text-amber-400" weight="fill" />
                  <span>Extract Tasks</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
