"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatusPill } from "@/components/ui/status-pill";
import { Task } from "@/types/database.types";
import { formatDate, formatDuration } from "@/lib/utils";
import {
  Plus,
  MagnifyingGlass,
  Eye,
  Queue,
} from "@phosphor-icons/react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  useEffect(() => {
    async function loadTasks() {
      try {
        const res = await fetch("/api/tasks");
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.bot?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [tasks, search, statusFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header
        title="Tasks"
        description="Historical and running task execution traces"
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filters and Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search tasks by ID, title, or bot..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full pl-10 pr-3 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] px-3 text-xs font-sans text-black focus:outline-none focus:border-black"
            >
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
          </div>

          <button
            onClick={() => setTaskDialogOpen(true)}
            className="inline-flex items-center justify-center transition-all duration-200 h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-1.5 shrink-0"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" />
            <span>New Task</span>
          </button>
        </div>

        {/* Tasks Table */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Queue className="h-4 w-4 text-neutral-500" />
              <h2 className="text-[16px] font-semibold text-black font-sans">
                Task Execution Registry
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {filteredTasks.length} {filteredTasks.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400 animate-pulse font-mono">
                Loading task records...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="text-sm font-semibold text-black font-sans">
                  {tasks.length === 0 ? "No tasks created yet." : "No tasks match your filter."}
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-sans leading-relaxed">
                  {tasks.length === 0
                    ? "Create your first task to see the transparent multi-layer execution pipeline."
                    : "Try clearing your search query or status filter to see other tasks."}
                </p>
                {tasks.length === 0 && (
                  <button
                    onClick={() => setTaskDialogOpen(true)}
                    className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-black text-white text-xs font-medium hover:bg-[#1A1A1A] transition-colors mt-2"
                  >
                    Create Task
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] font-sans">
                  <thead>
                    <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]/70">
                      <th className="text-left py-3.5 px-6 font-mono text-[11px] uppercase text-neutral-400 font-medium">Task ID</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Task Description</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Bot</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Status</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Duration</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Created</th>
                      <th className="text-right py-3.5 px-6 font-mono text-[11px] uppercase text-neutral-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t, idx) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-[#FAFAFA] border-b border-[#F0F0F0] last:border-0 transition-colors ${
                          idx % 2 === 1 ? "bg-[#FAFAFA]/30" : ""
                        }`}
                      >
                        <td className="py-4 px-6 font-mono text-[11px] text-neutral-400">
                          {t.id.slice(0, 16)}
                        </td>
                        <td className="py-4 px-4 font-medium text-black max-w-[280px] truncate text-xs font-sans">
                          {t.title}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] text-neutral-700">
                            {t.bot?.name || "Auto"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="py-4 px-4 font-mono text-neutral-500 text-[11px]">
                          {t.completed_at && t.started_at
                            ? formatDuration(
                                new Date(t.completed_at).getTime() -
                                  new Date(t.started_at).getTime()
                              )
                            : t.status === "running"
                            ? "Running"
                            : "--"}
                        </td>
                        <td className="py-4 px-4 text-neutral-400 text-[11px] font-mono">
                          {formatDate(t.created_at)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/app/tasks/${t.id}`}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-[#EBEBEB] bg-white hover:border-black text-neutral-500 hover:text-black transition-colors shadow-2xs"
                            title="View Execution Trace"
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
