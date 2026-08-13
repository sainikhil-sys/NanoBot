"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  Lightning,
  Plus,
  Play,
  Clock,
  Broadcast,
  UploadSimple,
  CheckCircle,
  Pause,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";
import { AutomationRule } from "@/app/api/automations/route";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<"schedule" | "file_upload" | "webhook" | "event">("schedule");
  const [triggerConfig, setTriggerConfig] = useState("0 9 * * 1-5 (Weekdays at 9:00 AM)");
  const [runningId, setRunningId] = useState<string | null>(null);

  const loadAutomations = async () => {
    try {
      const res = await fetch("/api/automations");
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations || []);
      }
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  const handleCreateAutomation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          triggerType,
          triggerConfig,
          workflowId: "wf-web-monitor",
          workflowName: "Daily AI Intelligence & News Brief",
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setName("");
        setDescription("");
        loadAutomations();
      }
    } catch (err) {
      console.error("Automation creation error:", err);
    }
  };

  const handleRunNow = async (id: string) => {
    setRunningId(id);
    // Simulate immediate trigger
    setTimeout(() => {
      setRunningId(null);
      setAutomations((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, lastRun: "Just now", executionCount: a.executionCount + 1 }
            : a
        )
      );
    }, 1200);
  };

  const handleToggleStatus = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "active" ? "paused" : "active" }
          : a
      )
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Automations Engine"
        description="Event-triggered and schedule-based autonomous AI pipelines"
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>Create Automation</span>
          </button>
        }
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[11px] font-mono uppercase text-[#6B7280]">Active Schedules</div>
            <div className="text-2xl font-bold text-black mt-1 font-mono">
              {automations.filter((a) => a.status === "active").length}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[11px] font-mono uppercase text-[#6B7280]">Total Automated Runs</div>
            <div className="text-2xl font-bold text-black mt-1 font-mono">
              {automations.reduce((acc, a) => acc + a.executionCount, 0)}
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[11px] font-mono uppercase text-[#6B7280]">Pipeline Reliability</div>
            <div className="text-2xl font-bold text-[#16A34A] mt-1 font-mono">100%</div>
          </div>
        </div>

        {/* Automations List */}
        <div className="space-y-4">
          {automations.map((item) => {
            const isSchedule = item.triggerType === "schedule";
            const isFile = item.triggerType === "file_upload";
            const isWebhook = item.triggerType === "webhook";

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-[#E5E7EB] bg-white hover:border-black/30 transition-colors shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-black shrink-0">
                      {isSchedule && <Clock weight="bold" className="h-4 w-4 text-[#16A34A]" />}
                      {isFile && <UploadSimple weight="bold" className="h-4 w-4 text-blue-600" />}
                      {isWebhook && <Broadcast weight="bold" className="h-4 w-4 text-purple-600" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-black font-sans">{item.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                            item.status === "active"
                              ? "bg-green-50 text-[#16A34A] border border-green-200"
                              : "bg-neutral-100 text-[#6B7280] border border-[#E5E7EB]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5 font-sans">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRunNow(item.id)}
                      disabled={runningId === item.id}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-semibold text-black transition-colors shadow-2xs disabled:opacity-50"
                    >
                      {runningId === item.id ? (
                        <>
                          <span className="h-2.5 w-2.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                          <span>Triggering...</span>
                        </>
                      ) : (
                        <>
                          <Play weight="fill" className="h-3 w-3 text-[#16A34A]" />
                          <span>Trigger Now</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item.id)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs text-[#6B7280] hover:text-black transition-colors"
                    >
                      {item.status === "active" ? (
                        <>
                          <Pause className="h-3 w-3" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center gap-4 text-xs font-mono text-[#6B7280]">
                  <div>
                    <span className="text-[#9CA3AF]">Trigger:</span>{" "}
                    <span className="text-black font-semibold">{item.triggerConfig}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Attached Workflow:</span>{" "}
                    <span className="text-black">{item.workflowName}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Last Run:</span>{" "}
                    <span className="text-black">{item.lastRun || "Never"}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF]">Next Trigger:</span>{" "}
                    <span className="text-[#16A34A]">{item.nextRun || "N/A"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="text-base font-bold text-black">New Automation Rule</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-black text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateAutomation} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-black">Automation Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Research Crawler"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black">Description</label>
                  <input
                    type="text"
                    placeholder="Brief summary of automated action"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-black">Trigger Mode</label>
                  <select
                    value={triggerType}
                    onChange={(e: any) => setTriggerType(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  >
                    <option value="schedule">Periodic Cron Schedule</option>
                    <option value="file_upload">Document Upload Watcher</option>
                    <option value="webhook">Inbound HTTP Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-black">Schedule / Config</label>
                  <input
                    type="text"
                    value={triggerConfig}
                    onChange={(e) => setTriggerConfig(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs font-mono text-black focus:outline-none focus:border-black"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 h-9 rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-black hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 rounded-xl bg-black text-white hover:bg-neutral-900 text-xs font-semibold"
                  >
                    Save Automation
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
