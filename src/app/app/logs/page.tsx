"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Scroll,
  MagnifyingGlass,
  CheckCircle,
  WarningCircle,
  XCircle,
  Info,
  Funnel,
} from "@phosphor-icons/react";

interface LogEntry {
  id: string;
  timestamp: string;
  severity: "info" | "warn" | "error" | "success";
  component: string;
  executionId?: string;
  message: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  React.useEffect(() => {
    async function loadLogs() {
      try {
        const res = await fetch("/api/logs");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchSearch =
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.component.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "all" || l.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="System Logs & Telemetry"
        description="Structured operational events, component traces, and inference latency telemetry"
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3.5 top-2.5 h-4 w-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Filter logs by component, keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E7EB] bg-white text-xs text-black focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 rounded-xl border border-[#E5E7EB] bg-white px-3 text-xs font-mono text-black focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        {/* Logs Table / Stream */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between text-xs font-mono text-[#6B7280]">
            <span>Timestamp · Severity · Component</span>
            <span>{filteredLogs.length} Events Logged</span>
          </div>

          <div className="divide-y divide-[#E5E7EB] font-mono text-xs">
            {loading ? (
              <div className="p-12 text-center text-xs text-[#6B7280]">
                Loading system logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-16 text-center space-y-2">
                <Scroll className="h-8 w-8 text-[#D1D5DB] mx-auto" />
                <p className="text-xs text-[#6B7280] font-sans">
                  No system logs recorded yet. Logs are generated when tasks, workflow executions, and AI queries run.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                return (
                  <div key={log.id} className="p-3.5 flex items-start gap-3 hover:bg-[#FAFAFA] transition-colors">
                    <span className="text-[#9CA3AF] shrink-0 text-[11px] pt-0.5">{log.timestamp}</span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                        log.severity === "success"
                          ? "bg-green-50 text-[#16A34A] border border-green-200"
                          : log.severity === "warn"
                          ? "bg-amber-50 text-amber-600 border border-amber-200"
                          : log.severity === "error"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}
                    >
                      {log.severity}
                    </span>

                    <span className="px-2 py-0.5 rounded bg-[#FAFAFA] border border-[#E5E7EB] text-black font-semibold shrink-0 text-[11px]">
                      {log.component}
                    </span>

                    <span className="text-[#374151] flex-1 break-words">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
