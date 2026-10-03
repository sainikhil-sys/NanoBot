"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lightning,
  Robot,
  Books,
  Broadcast,
  ShieldCheck,
  Globe,
  MagnifyingGlass,
  Pulse,
  EnvelopeSimple,
  Calendar,
  HardDrives,
  LinkedinLogo,
  CheckCircle,
  XCircle,
  ArrowClockwise,
  Clock,
  Plugs,
  GitBranch,
  Sparkle,
  Brain,
  ChartBar,
  Flask,
  Database,
  Plus,
  Minus,
  GithubLogo,
} from "@phosphor-icons/react";
import { AnnouncementMarquee } from "@/components/layout/announcement-marquee";

/* Respect reduced motion for JS-driven animation (hero only). */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

/* Content is ALWAYS visible - never gated behind JS/hydration. A subtle CSS slide
   (globals.css .nb-reveal) provides entrance polish and is disabled under
   prefers-reduced-motion. If JS never runs, content still shows. */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  void delay;
  return <div className={`nb-reveal ${className}`.trim()}>{children}</div>;
}

/* ---------- Header ---------- */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className={`backdrop-blur-md bg-white/85 border-b border-[#EBEBEB] transition-all duration-200 sticky top-0 z-50 ${scrolled ? "shadow-sm" : ""}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-mono text-sm font-bold shadow-xs">N</div>
          <span className="text-[19px] font-semibold text-black tracking-tight font-sans">NanoBot</span>
        </Link>
        <nav className="hidden md:flex gap-7 items-center text-sm text-neutral-600 font-sans">
          <a href="#how" className="hover:text-black transition-colors">How it works</a>
          <a href="#builder" className="hover:text-black transition-colors">Builder</a>
          <a href="#integrations" className="hover:text-black transition-colors">Integrations</a>
          <a href="#control" className="hover:text-black transition-colors">Control</a>
          <a href="#faq" className="hover:text-black transition-colors">FAQ</a>
          <Link href="/app/overview" className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-sm font-medium tracking-tight shadow-xs gap-1.5">
            <span>Open NanoBot</span><ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ---------- Hero with live-looking workflow ---------- */
const PIPELINE = [
  { label: "GitHub Issue", icon: GithubLogo, kind: "Trigger" },
  { label: "NanoBot Agent", icon: Robot, kind: "Agent" },
  { label: "Classify", icon: Sparkle, kind: "AI" },
  { label: "Knowledge", icon: Books, kind: "RAG" },
  { label: "Slack", icon: Broadcast, kind: "Integration" },
  { label: "Human Approval", icon: ShieldCheck, kind: "Control" },
  { label: "Resolved", icon: CheckCircle, kind: "Result" },
];

function HeroWorkflow() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (reduced) { setActive(PIPELINE.length); return; }
    const t = setInterval(() => setActive((a) => (a >= PIPELINE.length ? 0 : a + 1)), 900);
    return () => clearInterval(t);
  }, [reduced]);
  return (
    <div className="w-full rounded-2xl border border-[#EBEBEB] bg-white shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF]">workflow run / live preview</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#16A34A]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" /> executing
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {PIPELINE.map((n, i) => {
          const done = i < active;
          const running = i === active && !reduced;
          const Icon = n.icon;
          return (
            <div key={n.label} className="flex items-center gap-3">
              <div
                className={`flex-1 flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                  done ? "border-green-200 bg-green-50/60" : running ? "border-black bg-white ring-2 ring-black/10" : "border-[#EBEBEB] bg-[#FAFAFA]"
                }`}
              >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-[#16A34A] text-white" : "bg-white border border-[#E5E7EB] text-black"}`}>
                  <Icon weight="bold" className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-black truncate">{n.label}</div>
                  <div className="text-[10px] font-mono text-[#9CA3AF]">{n.kind}</div>
                </div>
                <div className="ml-auto text-[11px] font-mono shrink-0">
                  {done ? <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" /> : running ? <span className="text-black">running</span> : <span className="text-[#C7C7C7]">idle</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white border-b border-[#EBEBEB]">
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #E2E2E2 1px, transparent 1px)", backgroundSize: "30px 30px", opacity: 0.4, maskImage: "radial-gradient(ellipse 80% 60% at 50% 30%, black 20%, transparent 100%)" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center border border-[#EBEBEB] rounded-full px-3.5 py-1 text-xs text-neutral-500 bg-white/80 backdrop-blur-sm shadow-2xs font-sans">
            AI agents / Knowledge / Workflow automation
          </div>
          <h1 className="leading-[0.98] font-medium tracking-tight text-black font-sans" style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
            Build AI workflows<br />that <span className="italic font-serif">actually</span> run.
          </h1>
          <p className="text-[17px] text-neutral-600 max-w-[520px] leading-[1.7] font-sans">
            NanoBot connects models, your knowledge, and real integrations into workflows you can build, execute, inspect, and control, with an assistant for your inbox, calendar, and tasks alongside.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/app/overview" className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-sm font-medium tracking-tight shadow-xs gap-1.5">
              <span>Open NanoBot</span><ArrowRight weight="bold" className="h-3.5 w-3.5" />
            </Link>
            <Link href="/app/workflows" className="inline-flex items-center justify-center h-11 px-6 rounded-full border border-[#EBEBEB] bg-white text-black hover:bg-neutral-50 text-sm font-medium tracking-tight">
              Explore workflows
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            {["Visual builder", "Versioned runs", "Retries & DLQ", "Human-in-the-loop"].map((c) => (
              <span key={c} className="text-xs text-neutral-500 border border-[#EBEBEB] rounded-full px-3 py-1 bg-white/80 font-mono">{c}</span>
            ))}
          </div>
        </div>
        <Reveal><HeroWorkflow /></Reveal>
      </div>
    </section>
  );
}

/* ---------- 02 Capability strip ---------- */
function CapabilityStrip() {
  const items = ["Visual workflow builder", "Versioned executions", "Retries + backoff", "Idempotent webhooks", "Dead-letter replay", "Human approval", "Masked secret logs"];
  return (
    <section className="border-b border-[#EBEBEB] bg-[#FAFAFA] py-5 marquee-container overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-3"><p className="text-[11px] text-neutral-400 tracking-widest uppercase font-mono">What is actually built</p></div>
      <div className="relative overflow-hidden">
        <div className="animate-marquee-infinite whitespace-nowrap flex items-center gap-10">
          {[...items, ...items].map((t, i) => (
            <span key={i} className="text-[13px] font-medium text-neutral-500 whitespace-nowrap px-2 font-sans tracking-wide inline-flex items-center gap-2">
              <CheckCircle weight="fill" className="h-3.5 w-3.5 text-[#16A34A]" />{t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Section heading helper ---------- */
function Kicker({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">{eyebrow}</p>
      <h2 className="font-medium tracking-tight text-black font-sans leading-tight" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>{title}</h2>
      {desc && <p className="text-[15px] text-neutral-600 mt-3 leading-relaxed">{desc}</p>}
    </div>
  );
}

/* ---------- 03 From trigger to result ---------- */
function TriggerToResult() {
  const steps = [
    { k: "Trigger", d: "Webhook, schedule, or manual", icon: Lightning },
    { k: "Understand", d: "Tokenize & classify intent", icon: Brain },
    { k: "Retrieve", d: "Search knowledge & embeddings", icon: Books },
    { k: "Reason", d: "LLM / agent step", icon: Sparkle },
    { k: "Act", d: "Call a real integration", icon: Plugs },
    { k: "Verify", d: "Condition / human approval", icon: ShieldCheck },
    { k: "Result", d: "Persisted, inspectable run", icon: CheckCircle },
  ];
  return (
    <section id="how" className="py-20 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="From trigger to result" title="Every run follows the same transparent path." desc="No black box. Each stage is a real node that executes, records its input and output, and shows exactly what happened." /></Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.k}>
                <div className="h-full p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] hover:border-black transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mb-3"><Icon weight="bold" className="h-4 w-4 text-black" /></div>
                  <div className="text-[13px] font-bold text-black">{s.k}</div>
                  <div className="text-[11px] text-neutral-500 mt-1 leading-snug">{s.d}</div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- 04 Workflow builder ---------- */
function BuilderSection() {
  const nodes = [
    { t: "GitHub", i: GithubLogo }, { t: "Classify Issue", i: Sparkle }, { t: "RAG Search", i: Books },
    { t: "Condition", i: GitBranch }, { t: "Slack", i: Broadcast }, { t: "Approval", i: ShieldCheck }, { t: "Response", i: CheckCircle },
  ];
  return (
    <section id="builder" className="py-20 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="Workflow builder" title="Compose nodes into a real, versioned pipeline." desc="Triggers, AI, logic, data and communication nodes. Editing publishes a new version, and in-flight runs keep the version they started on." /></Reveal>
        <Reveal>
          <div className="rounded-2xl border border-[#EBEBEB] bg-white p-5 shadow-sm overflow-x-auto">
            <div className="flex items-stretch gap-2 min-w-max">
              {nodes.map((n, i) => {
                const Icon = n.i;
                return (
                  <React.Fragment key={n.t}>
                    <div className="w-36 p-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]">
                      <div className="h-8 w-8 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center mb-2"><Icon weight="bold" className="h-4 w-4 text-black" /></div>
                      <div className="text-[12px] font-semibold text-black">{n.t}</div>
                      <div className="text-[10px] font-mono text-[#16A34A] mt-1">success</div>
                    </div>
                    {i < nodes.length - 1 && <div className="flex items-center text-[#C7C7C7]"><ArrowRight weight="bold" className="h-4 w-4" /></div>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </Reveal>
        <div className="mt-6"><Link href="/app/workflows" className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline">Open the Workflows studio <ArrowRight weight="bold" className="h-3.5 w-3.5" /></Link></div>
      </div>
    </section>
  );
}

/* ---------- 05+06 Agents & Knowledge ---------- */
function AgentsKnowledge() {
  return (
    <section className="py-20 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Reveal>
          <div className="h-full p-7 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA]">
            <div className="h-11 w-11 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mb-5"><Robot weight="bold" className="h-5 w-5 text-black" /></div>
            <h3 className="text-[20px] font-semibold text-black mb-2">AI agents that use real tools</h3>
            <p className="text-[14px] text-neutral-600 leading-relaxed mb-4">Intent, plan, tool selection, execution, observation, result. Every tool call is logged so you can see what the agent did.</p>
            <div className="flex flex-wrap gap-2">
              {["HTTP", "Web search", "Embeddings", "Integrations", "Code (JS sandbox)"].map((t) => <span key={t} className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#374151]">{t}</span>)}
            </div>
            <Link href="/app/bots" className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline mt-5">Explore agents <ArrowRight weight="bold" className="h-3.5 w-3.5" /></Link>
          </div>
        </Reveal>
        <Reveal>
          <div className="h-full p-7 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA]">
            <div className="h-11 w-11 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-center mb-5"><Books weight="bold" className="h-5 w-5 text-black" /></div>
            <h3 className="text-[20px] font-semibold text-black mb-2">Knowledge & RAG with citations</h3>
            <p className="text-[14px] text-neutral-600 leading-relaxed mb-4">Upload, parse, chunk, embed, retrieve, answer. Responses expose the source references they were grounded on.</p>
            <div className="flex flex-wrap gap-2">
              {["PDF", "DOCX", "TXT", "Markdown", "CSV", "Code"].map((t) => <span key={t} className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#374151]">{t}</span>)}
            </div>
            <Link href="/app/knowledge" className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline mt-5">Open Knowledge <ArrowRight weight="bold" className="h-3.5 w-3.5" /></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 07 Integrations ---------- */
const INTEGRATIONS = [
  { n: "HTTP Request", i: Globe }, { n: "Webhooks", i: Broadcast }, { n: "LLM", i: Sparkle },
  { n: "Embeddings", i: Pulse }, { n: "Web Search", i: MagnifyingGlass }, { n: "Email", i: EnvelopeSimple },
  { n: "Gmail", i: EnvelopeSimple }, { n: "Google Calendar", i: Calendar }, { n: "Google Drive", i: HardDrives }, { n: "LinkedIn", i: LinkedinLogo },
];
function IntegrationsSection() {
  return (
    <section id="integrations" className="py-20 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="Integrations" title="Only what actually works." desc="Each integration here has a real execution path. Connect OAuth providers from Connected Accounts; status reflects your real configuration." /></Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {INTEGRATIONS.map((it) => {
            const Icon = it.i;
            return (
              <Reveal key={it.n}>
                <div className="p-4 rounded-2xl border border-[#EBEBEB] bg-white hover:border-black transition-colors flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center shrink-0"><Icon weight="bold" className="h-4 w-4 text-black" /></div>
                  <span className="text-[13px] font-semibold text-black">{it.n}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
        <div className="mt-6"><Link href="/app/integrations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline">See integration status <ArrowRight weight="bold" className="h-3.5 w-3.5" /></Link></div>
      </div>
    </section>
  );
}

/* ---------- 08 Automations ---------- */
function AutomationsSection() {
  const triggers = [{ t: "Schedule", i: Clock }, { t: "Webhook", i: Broadcast }, { t: "Manual", i: Lightning }];
  return (
    <section className="py-20 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="Automations" title="Schedule it. Trigger it. Let NanoBot execute it." desc="Bind a trigger to a workflow. Every execution is recorded, and the run count you see is real, never fabricated." /></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {triggers.map((t) => {
            const Icon = t.i;
            return (
              <Reveal key={t.t}>
                <div className="p-5 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center"><Icon weight="bold" className="h-4 w-4 text-[#16A34A]" /></div>
                  <span className="text-sm font-semibold text-black">{t.t}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal>
          <div className="flex flex-wrap items-center gap-2 text-sm font-mono text-[#374151] p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA]">
            <span className="font-semibold">Trigger</span><ArrowRight className="h-4 w-4 text-[#C7C7C7]" />
            <span className="font-semibold">Workflow</span><ArrowRight className="h-4 w-4 text-[#C7C7C7]" />
            <span className="font-semibold">Execution</span><ArrowRight className="h-4 w-4 text-[#C7C7C7]" />
            <span className="font-semibold text-[#16A34A]">Result</span>
          </div>
        </Reveal>
        <div className="mt-6"><Link href="/app/automations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline">Open Automations <ArrowRight weight="bold" className="h-3.5 w-3.5" /></Link></div>
      </div>
    </section>
  );
}

/* ---------- 09 Human control ---------- */
function HumanControl() {
  const controls = [{ t: "Pause", i: Clock }, { t: "Resume", i: ArrowRight }, { t: "Edit", i: GitBranch }, { t: "Run now", i: Lightning }, { t: "Replay", i: ArrowClockwise }, { t: "Disable", i: XCircle }];
  return (
    <section id="control" className="py-20 bg-[#0B0B0C] text-white border-b border-black">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal>
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-500 mb-2 font-mono">Human control</p>
          <h2 className="font-medium tracking-tight font-sans leading-tight mb-3" style={{ fontSize: "clamp(28px, 4vw, 44px)" }}>Automation without losing control.</h2>
          <p className="text-[15px] text-neutral-400 max-w-2xl leading-relaxed mb-8">Sensitive actions can require a human approval before they run. And every automation can be paused, edited, replayed or disabled at any time.</p>
        </Reveal>
        <Reveal>
          <div className="flex flex-wrap items-center gap-3 mb-8 text-sm font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">AI proposes action</span>
            <ArrowRight className="h-4 w-4 text-neutral-600" />
            <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">Human approval</span>
            <ArrowRight className="h-4 w-4 text-neutral-600" />
            <span className="px-3 py-1.5 rounded-lg bg-[#16A34A]/15 border border-[#16A34A]/30 text-[#86efac]">Execute</span>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {controls.map((c) => {
            const Icon = c.i;
            return (
              <Reveal key={c.t}>
                <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-2">
                  <Icon weight="bold" className="h-4 w-4 text-[#86efac]" /><span className="text-[13px] font-semibold">{c.t}</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- 10 Observability ---------- */
function Observability() {
  const rows = [
    { t: "Trigger", s: "ok" }, { t: "Agent", s: "ok" }, { t: "Retrieval", s: "ok" },
    { t: "Integration", s: "fail" }, { t: "Retry 2/3", s: "retry" }, { t: "Completed", s: "ok" },
  ];
  return (
    <section className="py-20 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <Kicker eyebrow="Observability" title="Inspect every execution." desc="Each run keeps a full trace: node status, duration, retries, inputs and outputs (secrets masked), and logs. Permanent failures land in a dead-letter queue you can replay." />
          <Link href="/app/executions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:underline">Open Executions <ArrowRight weight="bold" className="h-3.5 w-3.5" /></Link>
        </Reveal>
        <Reveal>
          <div className="rounded-2xl border border-[#EBEBEB] bg-[#0B0B0C] p-5 font-mono text-[13px] text-neutral-300">
            <div className="text-neutral-500 mb-3">RUN / workflow v3</div>
            {rows.map((r) => (
              <div key={r.t} className="flex items-center gap-2 py-1">
                {r.s === "ok" && <CheckCircle weight="fill" className="h-4 w-4 text-[#16A34A]" />}
                {r.s === "fail" && <XCircle weight="fill" className="h-4 w-4 text-red-500" />}
                {r.s === "retry" && <ArrowClockwise weight="bold" className="h-4 w-4 text-amber-400" />}
                <span className={r.s === "fail" ? "text-red-400" : r.s === "retry" ? "text-amber-300" : ""}>{r.t}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------- 11 Labs ---------- */
function LabsSection() {
  const labs = [
    { t: "NLP Lab", d: "Tokenization, sentiment, entities, readability.", i: Brain, href: "/app/nlp-lab" },
    { t: "Embedding Lab", d: "Vectors, magnitude, cosine similarity.", i: Pulse, href: "/app/embedding-lab" },
    { t: "NanoBench", d: "Measurements from real executions only.", i: ChartBar, href: "/app/nanobench" },
  ];
  return (
    <section className="py-20 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="Laboratory" title="See the NLP and vectors underneath." desc="Interactive labs that expose the real computations behind the product. Nothing is faked." /></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {labs.map((l) => {
            const Icon = l.i;
            return (
              <Reveal key={l.t}>
                <Link href={l.href} className="block h-full p-6 rounded-3xl border border-[#EBEBEB] bg-white hover:border-black transition-colors group">
                  <div className="h-11 w-11 rounded-2xl bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center mb-4"><Icon weight="bold" className="h-5 w-5 text-black" /></div>
                  <div className="text-[16px] font-semibold text-black flex items-center gap-1">{l.t}<Flask weight="bold" className="h-3.5 w-3.5 text-[#16A34A] opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                  <p className="text-[13px] text-neutral-600 mt-1 leading-relaxed">{l.d}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- 12 Use cases ---------- */
function UseCases() {
  const cases = [
    { role: "Developer", icon: GithubLogo, steps: "GitHub issue, classify, investigate, draft response, request approval" },
    { role: "Operations", icon: Lightning, steps: "Form submission, validate, classify, write to database, notify" },
    { role: "Knowledge", icon: Books, steps: "Upload documents, index, retrieve, answer with sources" },
    { role: "Data", icon: Database, steps: "Upload CSV, analyze, calculate, summarize" },
  ];
  return (
    <section className="py-20 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="Use cases" title="Concrete workflows, not slogans." /></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cases.map((c) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.role}>
                <div className="h-full p-6 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA]">
                  <div className="flex items-center gap-2 mb-3"><Icon weight="bold" className="h-4 w-4 text-black" /><span className="text-[13px] font-bold text-black uppercase tracking-wide font-mono">{c.role}</span></div>
                  <p className="text-[14px] text-neutral-700 font-mono leading-relaxed">{c.steps}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- 13 Security ---------- */
function Security() {
  const controls = ["Encrypted credentials (AES-256-GCM)", "Server-side secrets only", "OAuth scopes", "Webhook signature verification", "Idempotent event handling", "Masked secrets in logs", "Row-level tenant isolation", "Audit logs"];
  return (
    <section className="py-20 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <Reveal><Kicker eyebrow="Security & data control" title="Controls that are actually implemented." desc="No compliance badges we have not earned, just the concrete controls in the codebase today." /></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {controls.map((c) => (
            <Reveal key={c}>
              <div className="h-full p-4 rounded-2xl border border-[#EBEBEB] bg-white flex items-start gap-2">
                <ShieldCheck weight="fill" className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" /><span className="text-[13px] text-[#374151]">{c}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 14 FAQ ---------- */
const FAQS = [
  { q: "Is this just another AI chatbot?", a: "No. NanoBot is a workflow-automation platform: triggers, nodes, conditions, retries, webhooks and human approval, with AI as one kind of node among many. Chat is one surface, not the product." },
  { q: "What happens when a step fails?", a: "Retryable errors back off and retry; non-retryable ones stop immediately. A permanently failed run moves to a dead-letter queue where you can read the error and replay it." },
  { q: "Do my webhooks run twice if delivered twice?", a: "No. Webhooks are verified by signature and de-duplicated by event id, so a repeated delivery does not execute the workflow a second time." },
  { q: "Are the metrics on this page real?", a: "There are no fabricated metrics here. NanoBench only shows numbers measured by running the real services, and automation run counts come from actual executions." },
  { q: "How do I connect Gmail or LinkedIn?", a: "Configure your own OAuth app credentials, then connect from Connected Accounts. Tokens are exchanged server-side and stored encrypted, never exposed to the browser." },
];
function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-20 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-3xl mx-auto px-6">
        <Reveal><Kicker eyebrow="FAQ" title="Questions, answered plainly." /></Reveal>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q}>
              <div className="rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] overflow-hidden">
                <button type="button" onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-3 p-4 text-left">
                  <span className="text-[15px] font-semibold text-black">{f.q}</span>
                  {open === i ? <Minus className="h-4 w-4 text-neutral-500 shrink-0" /> : <Plus className="h-4 w-4 text-neutral-500 shrink-0" />}
                </button>
                {open === i && <div className="px-4 pb-4 text-[14px] text-neutral-600 leading-relaxed">{f.a}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 15 Final CTA ---------- */
function FinalCTA() {
  return (
    <section className="py-24 bg-white text-center px-6">
      <Reveal>
        <h2 className="font-medium tracking-tight text-black font-sans mb-4" style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>Build a workflow that actually runs.</h2>
        <p className="text-[16px] text-neutral-600 max-w-xl mx-auto mb-8">Open NanoBot and wire your first trigger to a result you can inspect end to end.</p>
        <Link href="/app/overview" className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-sm font-medium tracking-tight shadow-xs gap-1.5">
          <span>Open NanoBot</span><ArrowRight weight="bold" className="h-4 w-4" />
        </Link>
      </Reveal>
    </section>
  );
}

/* ---------- 16 Footer ---------- */
function Footer() {
  return (
    <footer className="bg-white border-t border-[#EBEBEB] py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-[13px] font-sans">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded bg-black text-white flex items-center justify-center font-mono text-xs font-bold">N</div>
            <span className="font-semibold text-black">NanoBot</span>
          </div>
          <p className="text-neutral-500 leading-relaxed text-xs">AI agents, knowledge, and workflow automation, with an assistant for your inbox, calendar, and tasks.</p>
        </div>
        <div>
          <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider font-mono">Platform</h4>
          <ul className="space-y-2 text-neutral-500 text-xs">
            <li><Link href="/app/overview" className="hover:text-black transition-colors">Overview</Link></li>
            <li><Link href="/app/workflows" className="hover:text-black transition-colors">Workflows</Link></li>
            <li><Link href="/app/automations" className="hover:text-black transition-colors">Automations</Link></li>
            <li><Link href="/app/executions" className="hover:text-black transition-colors">Executions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider font-mono">Laboratory</h4>
          <ul className="space-y-2 text-neutral-500 text-xs">
            <li><Link href="/app/nlp-lab" className="hover:text-black transition-colors">NLP Lab</Link></li>
            <li><Link href="/app/embedding-lab" className="hover:text-black transition-colors">Embedding Lab</Link></li>
            <li><Link href="/app/nanobench" className="hover:text-black transition-colors">NanoBench</Link></li>
            <li><Link href="/app/integrations" className="hover:text-black transition-colors">Integrations</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider font-mono">Assistant</h4>
          <ul className="space-y-2 text-neutral-500 text-xs">
            <li><Link href="/app/inbox" className="hover:text-black transition-colors">Inbox</Link></li>
            <li><Link href="/app/calendar" className="hover:text-black transition-colors">Calendar</Link></li>
            <li><Link href="/app/connected-accounts" className="hover:text-black transition-colors">Connected Accounts</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-8 text-[11px] font-mono text-neutral-400">(c) {new Date().getFullYear()} NanoBot. All rights reserved.</div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <AnnouncementMarquee />
      <Header />
      <HeroSection />
      <CapabilityStrip />
      <TriggerToResult />
      <BuilderSection />
      <AgentsKnowledge />
      <IntegrationsSection />
      <AutomationsSection />
      <HumanControl />
      <Observability />
      <LabsSection />
      <UseCases />
      <Security />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
