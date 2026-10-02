"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Globe,
  Broadcast,
  Sparkle,
  Pulse,
  MagnifyingGlass,
  EnvelopeSimple,
  Calendar,
  HardDrives,
  LinkedinLogo,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";

type CapKey = "http" | "webhooks" | "webSearch" | "embeddings" | "llm" | "email" | "google" | "linkedin";
type Capabilities = Record<CapKey, boolean>;

type Status = "available" | "needs-setup" | "needs-connection";

interface IntegrationDef {
  name: string;
  category: string;
  description: string;
  actions: string;
  icon: React.ComponentType<{ className?: string; weight?: "bold" | "regular" | "fill" }>;
  cap?: CapKey;
  oauth?: boolean;
  setupHint?: string;
}

const INTEGRATIONS: IntegrationDef[] = [
  { name: "HTTP Request", category: "Developer & Generic", description: "Call any REST API with SSRF protection.", actions: "GET - POST - PUT - PATCH - DELETE", icon: Globe },
  { name: "Webhooks", category: "Developer & Generic", description: "Receive signed, idempotent events to trigger workflows.", actions: "Inbound events - delivery log", icon: Broadcast },
  { name: "LLM", category: "AI", description: "Text generation and reasoning via Groq / OpenRouter.", actions: "Completion - agent steps", icon: Sparkle, cap: "llm", setupHint: "Set GROQ_API_KEY or OPENROUTER_API_KEY" },
  { name: "Embeddings", category: "AI", description: "Dense vector embeddings for similarity and RAG.", actions: "Embed text - similarity", icon: Pulse },
  { name: "Web Search", category: "AI", description: "Live web search results for grounding.", actions: "Search the web", icon: MagnifyingGlass },
  { name: "Email", category: "Communication", description: "Send transactional email.", actions: "Send email", icon: EnvelopeSimple, cap: "email", setupHint: "Set RESEND_API_KEY" },
  { name: "Gmail", category: "Productivity", description: "Read and act on your inbox.", actions: "Read - draft - send", icon: EnvelopeSimple, cap: "google", oauth: true, setupHint: "Configure Google OAuth (GOOGLE_CLIENT_ID)" },
  { name: "Google Calendar", category: "Productivity", description: "Read and manage calendar events.", actions: "List - create events", icon: Calendar, cap: "google", oauth: true, setupHint: "Configure Google OAuth (GOOGLE_CLIENT_ID)" },
  { name: "Google Drive", category: "Productivity", description: "Browse and read your files.", actions: "List - read files", icon: HardDrives, cap: "google", oauth: true, setupHint: "Configure Google OAuth (GOOGLE_CLIENT_ID)" },
  { name: "LinkedIn", category: "Productivity", description: "Access your LinkedIn profile context.", actions: "Profile context", icon: LinkedinLogo, cap: "linkedin", oauth: true, setupHint: "Configure LINKEDIN_CLIENT_ID" },
];

function resolveStatus(def: IntegrationDef, caps: Capabilities | null): Status {
  if (!def.cap) return "available";
  const ok = caps ? caps[def.cap] : false;
  if (!ok) return "needs-setup";
  return def.oauth ? "needs-connection" : "available";
}

export default function IntegrationsPage() {
  const [caps, setCaps] = useState<Capabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/integrations/status");
        if (!res.ok) throw new Error("Failed to load integration status");
        setCaps((await res.json()).capabilities);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <Header
        title="Integrations"
        description="Only integrations whose execution path actually works are shown. Status reflects your real configuration."
      />
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
            <WarningCircle weight="bold" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-36 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] animate-pulse" />
            ))}
          </div>
        ) : (
          categories.map((cat) => (
            <section key={cat} className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#6B7280] font-semibold">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {INTEGRATIONS.filter((i) => i.category === cat).map((def) => {
                  const status = resolveStatus(def, caps);
                  const Icon = def.icon;
                  return (
                    <div key={def.name} className="p-5 rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="h-9 w-9 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                          <Icon weight="bold" className="h-4 w-4 text-black" />
                        </div>
                        {status === "available" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-green-50 text-[#16A34A] border border-green-200">
                            <CheckCircle weight="fill" className="h-3 w-3" /> Available
                          </span>
                        ) : status === "needs-connection" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Connect account
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Needs setup
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-black">{def.name}</h3>
                        <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{def.description}</p>
                      </div>
                      <div className="text-[11px] font-mono text-[#9CA3AF]">{def.actions}</div>
                      {status === "needs-connection" && (
                        <Link href="/app/connected-accounts" className="inline-block text-[11px] font-semibold text-black hover:underline">
                          Connect in Connected Accounts -&gt;
                        </Link>
                      )}
                      {status === "needs-setup" && def.setupHint && (
                        <p className="text-[10px] font-mono text-amber-700">{def.setupHint}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
