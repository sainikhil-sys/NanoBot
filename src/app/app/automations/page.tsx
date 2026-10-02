"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Plus,
  Play,
  Clock,
  Broadcast,
  UploadSimple,
  Pause,
  Trash,
  Lightning,
  CheckCircle,
  XCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import type { Automation, WorkflowDefinition, WorkflowExecutionRecord } from "@/lib/workflows/types";

function relativeTime(iso?: string): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return diff >= 0 ? "Just now" : "Momentarily";
  if (mins < 60) return diff >= 0 ? `${mins}m ago` : `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return diff >= 0 ? `${hrs}h ago` : `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return diff >= 0 ? `${days}d ago` : `in ${days}d`;
}

interface WebhookDeliveryRow {
  id: string;
  status: "accepted" | "duplicate" | "rejected" | "error";
  eventId: string;
  runId?: string;
  reason?: string;
  receivedAt: string;
}

function WebhookPanel({ automation, onChanged }: { automation: Automation; onChanged: () => void }) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [deliveries, setDeliveries] = React.useState<WebhookDeliveryRow[] | null>(null);
  const [showDeliveries, setShowDeliveries] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/${automation.id}` : `/api/webhooks/${automation.id}`;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const loadDeliveries = async () => {
    const next = !showDeliveries;
    setShowDeliveries(next);
    if (next && deliveries === null) {
      try {
        const res = await fetch(`/api/webhooks/${automation.id}/deliveries`);
        if (res.ok) setDeliveries((await res.json()).deliveries || []);
      } catch {
        setDeliveries([]);
      }
    }
  };

  const regenerate = async () => {
    if (!confirm("Regenerate the signing secret? The old secret will stop working immediately.")) return;
    setRegenerating(true);
    try {
      await fetch(`/api/automations/${automation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateSecret: true }),
      });
      onChanged();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="pt-3 border-t border-[#E5E7EB] space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase text-[#9CA3AF] w-16 shrink-0">Endpoint</span>
        <code className="flex-1 min-w-0 truncate text-[11px] font-mono bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-black">
          POST {url}
        </code>
        <button type="button" onClick={() => copy(url, "url")} className="text-[11px] font-semibold text-black hover:underline shrink-0">
          {copied === "url" ? "Copied" : "Copy"}
        </button>
      </div>

      {automation.webhookSecret && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-[#9CA3AF] w-16 shrink-0">Secret</span>
          <code className="flex-1 min-w-0 truncate text-[11px] font-mono bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-black">
            {revealed ? automation.webhookSecret : "whsec_" + "•".repeat(20)}
          </code>
          <button type="button" onClick={() => setRevealed((r) => !r)} className="text-[11px] font-semibold text-black hover:underline shrink-0">
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button type="button" onClick={() => copy(automation.webhookSecret!, "secret")} className="text-[11px] font-semibold text-black hover:underline shrink-0">
            {copied === "secret" ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={regenerate} disabled={regenerating} className="text-[11px] font-semibold text-red-600 hover:underline shrink-0 disabled:opacity-50">
            {regenerating ? "…" : "Regenerate"}
          </button>
        </div>
      )}

      <p className="text-[10px] text-[#9CA3AF] font-mono leading-relaxed">
        Sign the raw body: <span className="text-[#6B7280]">x-nanobot-signature: sha256=HMAC_SHA256(body, secret)</span>.
        Set <span className="text-[#6B7280]">x-nanobot-event-id</span> for idempotency.
      </p>

      <button type="button" onClick={loadDeliveries} className="text-[11px] font-semibold text-black hover:underline">
        {showDeliveries ? "Hide deliveries" : "Recent deliveries"}
      </button>

      {showDeliveries && (
        <div className="space-y-1">
          {deliveries === null ? (
            <div className="text-[11px] text-[#9CA3AF]">Loading…</div>
          ) : deliveries.length === 0 ? (
            <div className="text-[11px] text-[#9CA3AF]">No deliveries yet. Send a POST to the endpoint above.</div>
          ) : (
            deliveries.map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-[11px] font-mono">
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    d.status === "accepted"
                      ? "bg-green-50 text-[#16A34A] border border-green-200"
                      : d.status === "duplicate"
                      ? "bg-neutral-100 text-[#6B7280] border border-[#E5E7EB]"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  {d.status}
                </span>
                <span className="text-[#9CA3AF] truncate">{d.eventId}</span>
                <span className="text-[#9CA3AF] ml-auto shrink-0">{relativeTime(d.receivedAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<WorkflowExecutionRecord | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [triggerType, setTriggerType] = useState<Automation["triggerType"]>("schedule");
  const [schedule, setSchedule] = useState("0 9 * * 1-5");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [aRes, wRes] = await Promise.all([fetch("/api/automations"), fetch("/api/workflows")]);
      if (!aRes.ok) throw new Error("Failed to load automations");
      const aData = await aRes.json();
      setAutomations(aData.automations || []);
      if (wRes.ok) {
        const wData = await wRes.json();
        setWorkflows(wData.workflows || []);
        if (!workflowId && wData.workflows?.[0]) setWorkflowId(wData.workflows[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load automations");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) return setFormError("Name is required.");
    if (!workflowId) return setFormError("Select a workflow to run.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          workflowId,
          triggerType,
          schedule: triggerType === "schedule" ? schedule.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create automation");
      setShowCreateModal(false);
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create automation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunNow = async (id: string) => {
    setBusyId(id);
    setLastRun(null);
    try {
      const res = await fetch(`/api/automations/${id}/run`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setLastRun(data.execution || null);
        await load();
      } else {
        setError(data.error || "Run failed");
      }
    } catch {
      setError("Run failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (a: Automation) => {
    setBusyId(a.id);
    try {
      await fetch(`/api/automations/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: a.status === "active" ? "paused" : "active" }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await fetch(`/api/automations/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const activeCount = automations.filter((a) => a.status === "active").length;
  const totalRuns = automations.reduce((acc, a) => acc + a.executionCount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Automations"
        description="Bind triggers to workflows. Scheduled runs fire from the scheduler tick; every run is recorded."
        action={
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={workflows.length === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <Plus weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>Create Automation</span>
          </button>
        }
      />

      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[11px] font-mono uppercase text-[#6B7280]">Active Automations</div>
            <div className="text-2xl font-bold text-black mt-1 font-mono">{activeCount}</div>
          </div>
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[11px] font-mono uppercase text-[#6B7280]">Total Runs Recorded</div>
            <div className="text-2xl font-bold text-black mt-1 font-mono">{totalRuns}</div>
          </div>
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA]">
            <div className="text-[11px] font-mono uppercase text-[#6B7280]">Configured Automations</div>
            <div className="text-2xl font-bold text-black mt-1 font-mono">{automations.length}</div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
            <WarningCircle weight="bold" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {lastRun && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
              lastRun.status === "completed"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {lastRun.status === "completed" ? (
              <CheckCircle weight="fill" className="h-4 w-4" />
            ) : (
              <XCircle weight="fill" className="h-4 w-4" />
            )}
            <span>
              Run {lastRun.status} in {Math.round(lastRun.durationMs || 0)}ms.{" "}
              <Link href="/app/executions" className="underline font-semibold">
                View trace
              </Link>
            </span>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] animate-pulse" />
            ))}
          </div>
        ) : automations.length === 0 ? (
          /* Empty state */
          <div className="p-12 text-center border border-dashed border-[#E5E7EB] rounded-2xl bg-[#FAFAFA]">
            <div className="h-12 w-12 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
              <Lightning weight="bold" className="h-5 w-5 text-[#16A34A]" />
            </div>
            <h3 className="text-sm font-bold text-black">No automations yet</h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-md mx-auto">
              Create an automation to run one of your workflows on a schedule, a webhook, or on demand.
              Nothing here is pre-populated — every run you see will be a real execution.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              disabled={workflows.length === 0}
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-semibold disabled:opacity-50"
            >
              <Plus weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>Create your first automation</span>
            </button>
            {workflows.length === 0 && (
              <p className="text-[11px] text-[#9CA3AF] mt-3">
                Create a workflow first in the{" "}
                <Link href="/app/workflows" className="underline">
                  Workflows
                </Link>{" "}
                studio.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((item) => {
              const isSchedule = item.triggerType === "schedule";
              const isFile = item.triggerType === "file_upload";
              const isWebhook = item.triggerType === "webhook";
              const busy = busyId === item.id;

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
                        {item.triggerType === "manual" && <Play weight="bold" className="h-4 w-4 text-black" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-black">{item.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              item.status === "active"
                                ? "bg-green-50 text-[#16A34A] border border-green-200"
                                : "bg-neutral-100 text-[#6B7280] border border-[#E5E7EB]"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.lastRunStatus && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                                item.lastRunStatus === "completed"
                                  ? "text-[#16A34A]"
                                  : item.lastRunStatus === "failed"
                                  ? "text-red-600"
                                  : "text-[#6B7280]"
                              }`}
                            >
                              last: {item.lastRunStatus}
                            </span>
                          )}
                        </div>
                        {item.description && <p className="text-xs text-[#6B7280] mt-0.5">{item.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRunNow(item.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs font-semibold text-black transition-colors shadow-2xs disabled:opacity-50"
                      >
                        {busy ? (
                          <>
                            <span className="h-2.5 w-2.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                            <span>Running…</span>
                          </>
                        ) : (
                          <>
                            <Play weight="fill" className="h-3 w-3 text-[#16A34A]" />
                            <span>Run now</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 text-xs text-[#6B7280] hover:text-black transition-colors disabled:opacity-50"
                      >
                        {item.status === "active" ? (
                          <>
                            <Pause className="h-3 w-3" /> <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> <span>Resume</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={busy}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[#E5E7EB] bg-white hover:bg-red-50 hover:border-red-200 text-[#6B7280] hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete automation"
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-[#6B7280]">
                    <div>
                      <span className="text-[#9CA3AF]">Trigger:</span>{" "}
                      <span className="text-black font-semibold">
                        {isSchedule ? item.schedule : item.triggerType}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Workflow:</span>{" "}
                      <span className="text-black">{item.workflowName}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Runs:</span>{" "}
                      <span className="text-black">{item.executionCount}</span>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Last:</span>{" "}
                      <span className="text-black">{relativeTime(item.lastRunAt)}</span>
                    </div>
                    {isSchedule && (
                      <div>
                        <span className="text-[#9CA3AF]">Next:</span>{" "}
                        <span className="text-[#16A34A]">
                          {item.status === "active" ? relativeTime(item.nextRunAt) : "paused"}
                        </span>
                      </div>
                    )}
                  </div>

                  {isWebhook && <WebhookPanel automation={item} onChanged={load} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <h3 className="text-base font-bold text-black">New Automation</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-neutral-400 hover:text-black text-xs font-mono"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-black">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily research brief"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-black">Description</label>
                  <input
                    type="text"
                    placeholder="Optional summary"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-black">Workflow</label>
                  <select
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  >
                    {workflows.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-black">Trigger</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value as Automation["triggerType"])}
                    className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs text-black focus:outline-none focus:border-black"
                  >
                    <option value="schedule">Schedule (cron / interval)</option>
                    <option value="manual">Manual (run now only)</option>
                    <option value="webhook">Webhook</option>
                    <option value="file_upload">File upload</option>
                  </select>
                </div>
                {triggerType === "schedule" && (
                  <div>
                    <label className="text-xs font-medium text-black">Schedule</label>
                    <input
                      type="text"
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className="w-full h-9 px-3 mt-1 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-xs font-mono text-black focus:outline-none focus:border-black"
                    />
                    <p className="text-[10px] text-[#9CA3AF] mt-1 font-mono">
                      Cron (e.g. 0 9 * * 1-5) or interval (e.g. every:30m, every:2h, every:1d)
                    </p>
                  </div>
                )}

                {formError && <p className="text-xs text-red-600">{formError}</p>}

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
                    disabled={submitting}
                    className="px-4 h-9 rounded-xl bg-black text-white hover:bg-neutral-900 text-xs font-semibold disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save automation"}
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
