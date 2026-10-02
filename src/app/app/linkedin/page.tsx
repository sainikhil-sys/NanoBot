"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  LinkedinLogo,
  Sparkle,
  Copy,
  CheckCircle,
  PaperPlaneTilt,
  Hash,
  Clock,
  ShieldCheck,
} from "@phosphor-icons/react";
import { LinkedInDraftResponse } from "@/lib/tools/personal/linkedin-service";

export default function LinkedInPage() {
  const [topic, setTopic] = useState<string>("Building autonomous personal AI assistants with multi-agent orchestration");
  const [tone, setTone] = useState<"thought_leadership" | "technical" | "announcement">("thought_leadership");
  const [draft, setDraft] = useState<LinkedInDraftResponse | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [publishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    try {
      setGenerating(true);
      const res = await fetch("/api/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", topic, tone }),
      });
      const json = await res.json();
      if (json.success && json.draft) {
        setDraft(json.draft);
      }
    } catch (err) {
      console.error("Failed to generate LinkedIn post:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.fullPost);
    setCopied(true);
    setToastMessage("Copied post markdown to clipboard!");
    setTimeout(() => {
      setCopied(false);
      setToastMessage(null);
    }, 3000);
  };

  const handlePublish = async () => {
    if (!draft) return;
    try {
      setPublishing(true);
      const res = await fetch("/api/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", postText: draft.fullPost }),
      });
      const json = await res.json();
      if (json.success) {
        setPublishModalOpen(false);
        setToastMessage("Post published successfully to your LinkedIn account!");
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setToastMessage(`Notice: ${json.error || "Please connect your LinkedIn account."}`);
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Failed to publish post:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="LinkedIn Thought Leadership Studio"
        subtitle="Generate professional engineering and leadership posts, optimize hooks and hashtags, and publish with 1-click confirmation."
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Generator Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
                <Sparkle className="w-4 h-4 text-amber-400" />
                Post Generator Parameters
              </h3>

              <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Post Topic or Milestone *:</label>
                  <textarea
                    rows={4}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Announcing our Next.js 15 personal AI agent framework..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs leading-relaxed focus:outline-hidden focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1 font-semibold">Narrative Tone:</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-700 text-neutral-200 text-xs"
                  >
                    <option value="thought_leadership">Thought Leadership (Visionary & Strategic)</option>
                    <option value="technical">Technical Deep Dive (Architectural & Precise)</option>
                    <option value="announcement">Milestone Announcement (Excited & Clear)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={generating || !topic.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Sparkle className="w-4 h-4 text-amber-400" weight="fill" />
                  <span>{generating ? "Crafting Post..." : "Generate LinkedIn Draft"}</span>
                </button>
              </form>
            </div>

            {/* LinkedIn Policy Guarantee */}
            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                NanoBot strictly complies with LinkedIn API guidelines. Zero scraping, automated connection campaigns, or browser automation are used.
              </p>
            </div>
          </div>

          {/* Right: Post Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#0a66c2] text-white">
                    <LinkedinLogo className="w-4 h-4" weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200">LinkedIn Feed Preview</h4>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {draft ? draft.estimatedReadTime : "Draft Pending"}
                    </span>
                  </div>
                </div>

                {draft && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 transition"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" weight="fill" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy Markdown"}</span>
                    </button>
                    <button
                      onClick={() => setPublishModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-semibold transition"
                    >
                      <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
                      <span>Publish</span>
                    </button>
                  </div>
                )}
              </div>

              {draft ? (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {draft.fullPost}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {draft.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-sky-400 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-neutral-400 space-y-2">
                  <LinkedinLogo className="w-10 h-10 text-neutral-500 mx-auto" />
                  <p>Enter a topic on the left and click Generate to create a publication-ready post.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Publish Confirmation Modal */}
        {publishModalOpen && draft && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <LinkedinLogo className="w-4 h-4 text-[#0a66c2]" weight="fill" />
                  Confirm LinkedIn Publication
                </h3>
                <button onClick={() => setPublishModalOpen(false)} className="text-neutral-400 hover:text-neutral-200 text-xs">
                  Cancel
                </button>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                This post will be shared directly to your connected LinkedIn feed via the official Member Share API.
              </p>

              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                {draft.fullPost}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-semibold transition"
                >
                  <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
                  <span>{publishing ? "Publishing..." : "Confirm & Post"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
