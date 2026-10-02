"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  GoogleLogo,
  LinkedinLogo,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Key,
  EnvelopeSimple,
  Calendar,
  HardDrives,
  LockSimple,
} from "@phosphor-icons/react";
import { ConnectedAccount } from "@/types/database.types";

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/connected-accounts");
      const json = await res.json();
      if (json.success && json.accounts) {
        setAccounts(json.accounts);
      }
    } catch (err) {
      console.error("Failed to load connected accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const params = new URLSearchParams(window.location.search);
    const successProvider = params.get("success");
    if (successProvider) {
      setToastMessage(`Successfully connected ${successProvider === "google" ? "Google Workspace" : "LinkedIn"}!`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  }, []);

  const handleConnect = async (provider: "google" | "linkedin") => {
    try {
      setActionLoading(provider);
      const res = await fetch("/api/connected-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const json = await res.json();
      if (json.success && json.authUrl) {
        window.location.href = json.authUrl;
      }
    } catch (err) {
      console.error(`Failed to initiate ${provider} auth:`, err);
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (provider: "google" | "linkedin") => {
    if (!confirm(`Are you sure you want to disconnect ${provider}? Your OAuth tokens will be revoked.`)) {
      return;
    }
    try {
      setActionLoading(provider);
      const res = await fetch(`/api/connected-accounts?provider=${provider}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        await fetchAccounts();
        setToastMessage(`${provider === "google" ? "Google" : "LinkedIn"} disconnected.`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(`Failed to disconnect ${provider}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const googleAccount = accounts.find((a) => a.provider === "google" && a.status === "connected");
  const linkedinAccount = accounts.find((a) => a.provider === "linkedin" && a.status === "connected");

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="Connected Accounts & Integrations"
        subtitle="Manage OAuth connections for Gmail, Google Calendar, Google Drive, and LinkedIn."
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Security & Zero-Leak Guarantee */}
        <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
            <ShieldCheck className="w-6 h-6" weight="duotone" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Production OAuth 2.0 Security Boundary</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              NanoBot uses official, standard OAuth 2.0 protocols. All credentials and refresh tokens remain strictly
              encrypted on the server side and are NEVER exposed to browser runtimes, client scripts, or third-party AI models.
              Actions requiring side effects (such as sending emails or booking meetings) always enforce explicit confirmation.
            </p>
          </div>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Workspace Card */}
          <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-6 flex flex-col justify-between hover:border-neutral-700 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white text-neutral-950 shadow-md">
                    <GoogleLogo className="w-6 h-6" weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-100">Google Workspace</h2>
                    <p className="text-xs text-neutral-400">Gmail, Google Calendar, Google Drive</p>
                  </div>
                </div>
                {googleAccount ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400">
                    Not Connected
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Empowers NanoBot to summarize important emails, find free calendar slots, draft replies, and retrieve Drive context.
              </p>

              {/* Sub-services status */}
              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple className="w-4 h-4 text-rose-400" />
                    <span>Gmail (Read, Search, Intelligent Inbox, Draft)</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{googleAccount ? "Active" : "Ready"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Google Calendar (Agendas, Availability, Scheduling)</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{googleAccount ? "Active" : "Ready"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <HardDrives className="w-4 h-4 text-amber-400" />
                    <span>Google Drive (Document Search, Semantic Parsing)</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">{googleAccount ? "Active" : "Ready"}</span>
                </div>
              </div>

              {googleAccount && (
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Account Email:</span>
                    <span className="text-neutral-200 font-mono">{googleAccount.email || "Primary Account"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Synced:</span>
                    <span className="text-neutral-200">
                      {googleAccount.last_synced_at
                        ? new Date(googleAccount.last_synced_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Just now"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
              {googleAccount ? (
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => handleConnect("google")}
                    disabled={actionLoading === "google"}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition text-center"
                  >
                    Re-authenticate Scopes
                  </button>
                  <button
                    onClick={() => handleDisconnect("google")}
                    disabled={actionLoading === "google"}
                    className="py-2.5 px-4 rounded-xl text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("google")}
                  disabled={actionLoading === "google"}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-white hover:bg-neutral-200 text-neutral-950 font-semibold transition flex items-center justify-center gap-2"
                >
                  <GoogleLogo className="w-4 h-4" weight="bold" />
                  {actionLoading === "google" ? "Connecting..." : "Connect Google Workspace"}
                </button>
              )}
            </div>
          </div>

          {/* LinkedIn Integration Card */}
          <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800 p-6 flex flex-col justify-between hover:border-neutral-700 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#0a66c2] text-white shadow-md">
                    <LinkedinLogo className="w-6 h-6" weight="fill" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-neutral-100">LinkedIn</h2>
                    <p className="text-xs text-neutral-400">Thought Leadership & Social Content</p>
                  </div>
                </div>
                {linkedinAccount ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400">
                    Not Connected
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Enables AI post generation, professional hook suggestions, hashtag optimization, and verified publishing with 1-click approval.
              </p>

              <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>AI Thought Leadership Generator</span>
                  <span className="text-[11px] text-emerald-400">Included</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Post Preview & Copy-Ready Markdown</span>
                  <span className="text-[11px] text-emerald-400">Included</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>Official Member Share API</span>
                  <span className="text-[11px] text-neutral-400">{linkedinAccount ? "Authorized" : "Ready"}</span>
                </div>
              </div>

              {linkedinAccount && (
                <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 text-xs text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Profile:</span>
                    <span className="text-neutral-200 font-mono">{linkedinAccount.email || "Active Profile"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scope:</span>
                    <span className="text-neutral-200">w_member_social</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 mt-4 border-t border-neutral-800/80 flex items-center justify-between">
              {linkedinAccount ? (
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => handleConnect("linkedin")}
                    disabled={actionLoading === "linkedin"}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition text-center"
                  >
                    Re-authenticate
                  </button>
                  <button
                    onClick={() => handleDisconnect("linkedin")}
                    disabled={actionLoading === "linkedin"}
                    className="py-2.5 px-4 rounded-xl text-xs font-medium bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 transition"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect("linkedin")}
                  disabled={actionLoading === "linkedin"}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-[#0a66c2] hover:bg-[#084e96] text-white font-semibold transition flex items-center justify-center gap-2"
                >
                  <LinkedinLogo className="w-4 h-4" weight="fill" />
                  {actionLoading === "linkedin" ? "Connecting..." : "Connect LinkedIn"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scopes & Permissions Transparency Table */}
        <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <LockSimple className="w-4 h-4 text-amber-400" />
            Active Scopes & Personal Data Controls
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">OAuth Scope</th>
                  <th className="pb-3 font-medium">Permission Tier</th>
                  <th className="pb-3 font-medium">Safety Guarantee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                <tr>
                  <td className="py-3 font-medium text-neutral-100">Gmail</td>
                  <td className="py-3 font-mono text-[11px] text-neutral-400">gmail.readonly / gmail.compose</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-500/30">READ / PREPARE</span></td>
                  <td className="py-3 text-neutral-400">Sends only with explicit user confirmation.</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-neutral-100">Calendar</td>
                  <td className="py-3 font-mono text-[11px] text-neutral-400">calendar.events / calendar.readonly</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-sky-950/60 text-sky-400 border border-sky-500/30">READ / EXECUTE</span></td>
                  <td className="py-3 text-neutral-400">No events created without slot selection.</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-neutral-100">Drive</td>
                  <td className="py-3 font-mono text-[11px] text-neutral-400">drive.readonly</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">READ</span></td>
                  <td className="py-3 text-neutral-400">Zero write or delete permissions requested.</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-neutral-100">LinkedIn</td>
                  <td className="py-3 font-mono text-[11px] text-neutral-400">w_member_social / openid</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">PREPARE / EXECUTE</span></td>
                  <td className="py-3 text-neutral-400">Interactive preview before any post is published.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
