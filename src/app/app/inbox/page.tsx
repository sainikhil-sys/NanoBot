"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  EnvelopeSimple,
  WarningCircle,
  Clock,
  CheckCircle,
  PaperPlaneTilt,
  ArrowsClockwise,
  Tag,
  Flame,
  ChatCircleText,
  GoogleLogo,
  User,
  CaretRight,
} from "@phosphor-icons/react";
import { GmailEmail } from "@/types/database.types";

export default function InboxPage() {
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [connected, setConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [draftingModalOpen, setDraftingModalOpen] = useState<boolean>(false);
  const [draftText, setDraftText] = useState<string>("");
  const [sendingState, setSendingState] = useState<"idle" | "sending" | "sent">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gmail");
      const json = await res.json();
      if (json.success) {
        setEmails(json.emails || []);
        setConnected(json.connected ?? true);
        if (json.emails && json.emails.length > 0 && !selectedEmail) {
          setSelectedEmail(json.emails[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleStartDraft = (email: GmailEmail) => {
    const defaultBody = `Hi ${email.fromName},\n\nThank you for reaching out regarding "${email.subject}". I have reviewed the details and will follow up shortly.\n\nBest regards,\nNikhil`;
    setDraftText(defaultBody);
    setDraftingModalOpen(true);
    setSendingState("idle");
  };

  const handleSendEmail = async () => {
    if (!selectedEmail || !draftText.trim()) return;
    try {
      setSendingState("sending");
      const res = await fetch("/api/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          to: selectedEmail.from,
          subject: `Re: ${selectedEmail.subject}`,
          bodyText: draftText,
          threadId: selectedEmail.threadId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSendingState("sent");
        setToastMessage(`Email reply dispatched successfully to ${selectedEmail.fromName}!`);
        setTimeout(() => {
          setDraftingModalOpen(false);
          setToastMessage(null);
          setSendingState("idle");
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to send email:", err);
      setSendingState("idle");
    }
  };

  const filteredEmails = emails.filter((e) => {
    if (filterCategory === "ALL") return true;
    if (filterCategory === "URGENT") return e.classification.urgencyScore >= 75 || e.classification.category === "URGENT";
    if (filterCategory === "ACTION") return e.classification.responseRequired;
    if (filterCategory === "MEETING") return e.classification.category === "MEETING";
    return e.classification.category === filterCategory;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="Intelligent Email Inbox"
        subtitle="AI-classified inbox with semantic urgency scoring, action item extraction, and 1-click reply drafting."
        actions={
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 transition"
          >
            <ArrowsClockwise className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Inbox</span>
          </button>
        }
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        {!connected ? (
          <div className="p-12 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center max-w-xl mx-auto space-y-5 my-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 text-white flex items-center justify-center mx-auto shadow-inner">
              <GoogleLogo className="w-8 h-8" weight="bold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-neutral-100">Connect Google Workspace to Enable Inbox</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your Google account in Connected Accounts to unlock semantic email classification,
                urgency scoring, and personalized reply drafting without leaving NanoBot.
              </p>
            </div>
            <Link
              href="/app/connected-accounts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
            >
              <GoogleLogo className="w-4 h-4" weight="bold" />
              <span>Connect Google Account</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: "ALL", label: "All Inquiries" },
                { id: "URGENT", label: "Urgent & High Priority" },
                { id: "ACTION", label: "Action Required" },
                { id: "MEETING", label: "Meetings & Invites" },
                { id: "PROJECT", label: "Projects" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-medium transition shrink-0 ${
                    filterCategory === tab.id
                      ? "bg-white text-neutral-950 border-white font-semibold"
                      : "bg-neutral-900/70 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Email Workspace (Split Pane) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
              {/* Left Pane: Email List */}
              <div className="lg:col-span-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col divide-y divide-neutral-800/60 overflow-hidden">
                <div className="p-3.5 bg-neutral-900/90 text-xs font-semibold text-neutral-300 flex justify-between items-center">
                  <span>Emails ({filteredEmails.length})</span>
                  <span className="text-[11px] text-neutral-400 font-mono">Semantic Sort</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/40">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400 space-y-2">
                      <EnvelopeSimple className="w-8 h-8 text-neutral-400 mx-auto" />
                      <p>No emails found matching this filter.</p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => {
                      const isSelected = selectedEmail?.id === email.id;
                      const isUrgent = email.classification.urgencyScore >= 75;

                      return (
                        <div
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`p-4 cursor-pointer transition flex flex-col gap-2 ${
                            isSelected ? "bg-neutral-800/80 border-l-2 border-indigo-400" : "hover:bg-neutral-900/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-200 truncate">{email.fromName}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {new Date(email.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>

                          <div className="text-xs font-medium text-neutral-100 truncate">{email.subject}</div>
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{email.snippet}</p>

                          <div className="flex items-center gap-2 pt-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                isUrgent
                                  ? "bg-rose-950/60 text-rose-300 border-rose-500/30"
                                  : email.classification.category === "MEETING"
                                  ? "bg-sky-950/60 text-sky-300 border-sky-500/30"
                                  : "bg-neutral-800 text-neutral-300 border-neutral-700"
                              }`}
                            >
                              {email.classification.category}
                            </span>
                            {email.classification.responseRequired && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/50 text-amber-300 border border-amber-500/20">
                                Action Needed
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Pane: Email Detail & AI Action Assistant */}
              <div className="lg:col-span-7 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-col overflow-hidden">
                {selectedEmail ? (
                  <div className="flex-1 flex flex-col divide-y divide-neutral-800/80">
                    {/* Header */}
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-base font-semibold text-neutral-100">{selectedEmail.subject}</h2>
                          <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                            <span>From: <strong className="text-neutral-200">{selectedEmail.fromName}</strong> ({selectedEmail.from})</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleStartDraft(selectedEmail)}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition shrink-0 shadow-sm"
                        >
                          <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
                          <span>Draft AI Reply</span>
                        </button>
                      </div>

                      {/* AI Intelligence Summary Card */}
                      <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-neutral-300">
                          <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-400" />
                            AI Semantic Assessment
                          </span>
                          <span className="text-neutral-400 font-mono">
                            Urgency: {selectedEmail.classification.urgencyScore}/100
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">{selectedEmail.classification.summary}</p>
                        {selectedEmail.classification.detectedAction && (
                          <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px] flex items-center gap-2">
                            <WarningCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>Recommended Action: {selectedEmail.classification.detectedAction}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="p-6 flex-1 text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto">
                      {selectedEmail.bodyText || selectedEmail.snippet}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-neutral-400">
                    <EnvelopeSimple className="w-10 h-10 text-neutral-400 mb-3" />
                    <p>Select an email from the left pane to view details and draft replies.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Draft & Send Confirmation Modal */}
        {draftingModalOpen && selectedEmail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <PaperPlaneTilt className="w-4 h-4 text-indigo-400" />
                  Draft Reply to {selectedEmail.fromName}
                </h3>
                <button
                  onClick={() => setDraftingModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-200 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1 font-mono text-[11px]">To:</label>
                  <input
                    disabled
                    value={selectedEmail.from}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-mono text-[11px]">Subject:</label>
                  <input
                    disabled
                    value={`Re: ${selectedEmail.subject}`}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Message Body:</label>
                  <textarea
                    rows={7}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs leading-relaxed focus:outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                🛡️ <strong>Safety Check</strong>: Sending emails requires explicit user confirmation.
                Review the content above before dispatching.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setDraftingModalOpen(false)}
                  disabled={sendingState === "sending"}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sendingState === "sending" || !draftText.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
                >
                  <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
                  <span>{sendingState === "sending" ? "Dispatching..." : sendingState === "sent" ? "Sent!" : "Confirm & Send"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
