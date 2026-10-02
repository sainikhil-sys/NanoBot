"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import {
  ArrowRight,
  Lightning,
  MagnifyingGlass,
  TreeStructure,
  Brain,
  Broadcast,
  ShieldCheck,
  Eye,
  Robot,
  Code,
  ChatCircle,
  Books,
  ChartBar,
  FileText,
  GraduationCap,
  CheckCircle,
  Cpu,
  Plus,
  Minus,
  Sparkle,
} from "@phosphor-icons/react";
import { AnimatedSearchExperience } from "@/components/search-experience/animated-search-experience";
import { AnnouncementMarquee } from "@/components/layout/announcement-marquee";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─────────────────────── 1. TOP ANNOUNCEMENT MARQUEE ─────────────────────── */
function TopMarquee() {
  return <AnnouncementMarquee />;
}

/* ─────────────────────── 2. FIXED HEADER ─────────────────────── */

function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`backdrop-blur-md bg-white/85 border-b border-[#EBEBEB] transition-all duration-200 sticky top-0 z-50 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-mono text-sm font-bold shadow-xs">
            N
          </div>
          <span className="text-[19px] font-semibold text-black tracking-tight font-sans">
            NanoBot
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex gap-8 items-center text-sm text-neutral-600 font-sans">
          <a href="#how" className="hover:text-black transition-colors">
            How it works
          </a>
          <a href="#bots" className="hover:text-black transition-colors">
            Specialized Bots
          </a>
          <a href="#execution" className="hover:text-black transition-colors">
            Execution
          </a>
          <a href="#faq" className="hover:text-black transition-colors">
            FAQ
          </a>
          <Link
            href="/app/overview"
            className="inline-flex items-center justify-center transition-all duration-200 h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-sm font-medium tracking-tight shadow-xs gap-1.5"
          >
            <span>Try NanoBot</span>
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─────────────────────── 3. HERO SECTION WITH INTERACTIVE SEARCH ─────────────────────── */

const PLACEHOLDER_PROMPTS = [
  "build a website for ecommerce fashion store",
  "audit python flask backend for static security vulnerabilities",
  "extract spatial feature tensor from ultrasound scan",
  "synthesize peer-reviewed literature on transformer architectures",
  "detect multidimensional outliers in quarterly financial telemetry",
];

function HeroSection() {
  const [promptIndex, setPromptIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="min-h-[92vh] flex flex-col items-center justify-center text-center pt-16 pb-28 relative overflow-hidden bg-white">
      {/* OQENS Radial dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, #D0D0D0 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.35,
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-5xl">
        {/* Pill badge */}
        <div>
          <div className="inline-flex items-center border border-[#EBEBEB] rounded-full px-3.5 py-1 text-xs text-neutral-500 bg-white/80 backdrop-blur-sm shadow-2xs font-sans">
            AI agents · Knowledge · Workflow automation
          </div>
        </div>

        {/* Hero Title */}
        <h1
          className="leading-[0.95] font-medium tracking-tight text-black max-w-4xl font-sans"
          style={{ fontSize: "clamp(48px, 8vw, 92px)" }}
        >
          Build AI workflows
          <br />
          that <span className="italic font-serif">actually</span> run.
        </h1>

        {/* Subtitle */}
        <p className="text-[18px] text-neutral-600 max-w-[560px] leading-[1.7] font-sans">
          NanoBot connects models, your knowledge, and real integrations into
          workflows you can build, execute, inspect, and control — with an
          assistant for your inbox, calendar, and tasks alongside.
        </p>

        {/* CTA Buttons */}
        <div className="flex gap-3 justify-center flex-wrap mt-2">
          <Link
            href="/app/overview"
            className="inline-flex items-center justify-center transition-all duration-200 h-11 px-6 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-sm font-medium tracking-tight shadow-xs gap-1.5"
          >
            <span>Open NanoBot →</span>
          </Link>
          <Link
            href="/app/workflows"
            className="inline-flex items-center justify-center transition-all duration-200 h-11 px-6 rounded-full border border-[#EBEBEB] bg-white text-black hover:bg-neutral-50 text-sm font-medium tracking-tight"
          >
            Explore workflows
          </Link>
        </div>

        {/* Interactive Search / Prompt Input Bar */}
        <div className="w-full max-w-2xl mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/app/overview";
            }}
            className="w-full border rounded-2xl bg-white p-2.5 flex items-center gap-3 shadow-sm border-[#EBEBEB] focus-within:border-black transition-colors"
          >
            <MagnifyingGlass
              weight="bold"
              className="text-neutral-400 ml-2.5 flex-shrink-0 h-4 w-4"
            />
            <div className="flex-1 relative h-6 overflow-hidden text-left">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={PLACEHOLDER_PROMPTS[promptIndex]}
                className="absolute inset-0 w-full outline-none text-[14px] bg-transparent text-black font-sans placeholder:text-neutral-400 placeholder:transition-opacity"
              />
            </div>
            <Link
              href="/app/overview"
              className="bg-black text-white text-xs font-medium px-5 py-2.5 rounded-xl hover:bg-[#1A1A1A] transition-colors flex-shrink-0 font-sans"
            >
              Execute
            </Link>
          </form>
        </div>

        {/* Capability chips (honest — describe what the product does) */}
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <span className="text-xs text-neutral-500 border border-[#EBEBEB] rounded-full px-3 py-1 bg-white/80 backdrop-blur-sm font-mono">
            Visual workflow builder
          </span>
          <span className="text-xs text-neutral-500 border border-[#EBEBEB] rounded-full px-3 py-1 bg-white/80 backdrop-blur-sm font-mono">
            Run traces · retries · DLQ
          </span>
          <span className="text-xs text-neutral-500 border border-[#EBEBEB] rounded-full px-3 py-1 bg-white/80 backdrop-blur-sm font-mono">
            Human-in-the-loop
          </span>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-60">
        <span className="text-[10px] tracking-widest text-neutral-400 uppercase font-mono">
          ↓ scroll
        </span>
      </div>
    </section>
  );
}

/* ─────────────────────── 4. LOGO MARQUEE ("TRUSTED BY BUILDERS") ─────────────────────── */

const PARTNERS = [
  "PyTorch",
  "FastAPI",
  "Supabase",
  "Next.js",
  "Vercel",
  "Linear",
  "OpenAI",
  "Groq",
  "TypeScript",
  "Docker",
  "Stripe",
  "Tailwind CSS",
];

function PartnerMarquee() {
  return (
    <section className="w-full border-y border-[#EBEBEB] py-5 overflow-hidden bg-[#FAFAFA] marquee-container select-none">
      <div className="max-w-6xl mx-auto px-6 mb-3 text-center md:text-left">
        <p className="text-[11px] text-neutral-400 tracking-widest uppercase font-mono">
          Engineered with modern infrastructure
        </p>
      </div>
      <div className="relative overflow-hidden">
        <div className="animate-marquee-infinite whitespace-nowrap flex items-center gap-12">
          {[...PARTNERS, ...PARTNERS].map((partner, i) => (
            <span
              key={i}
              className="text-[13px] font-medium text-neutral-400 whitespace-nowrap px-2 font-sans tracking-wide hover:text-black transition-colors"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 5. THE FLOATING ORBIT CARDS ("SEVEN BOTS. ONE PLATFORM.") ─────────────────────── */

const OQENS_ORBIT_CARDS = [
  {
    title: "ChatBot",
    tag: "CONVERSATIONAL",
    accent: "#c0392b",
    bg: "#1a0a0a",
    bars: [
      { label: "Semantic understanding", year: "2024", width: "90%" },
      { label: "Intent-aware queries", year: "2025", width: "75%" },
      { label: "Contextual dialogue", year: "2024", width: "85%" },
      { label: "Multi-turn reasoning", year: "2025", width: "80%" },
    ],
  },
  {
    title: "CodeBot",
    tag: "ENGINEERING",
    accent: "#f39c12",
    bg: "#1a1a0a",
    bars: [
      { label: "AST syntax parsing", year: "2024", width: "95%" },
      { label: "Complexity profiling", year: "2025", width: "88%" },
      { label: "Static security heuristics", year: "2024", width: "82%" },
      { label: "Algorithmic synthesis", year: "2025", width: "90%" },
    ],
  },
  {
    title: "VisionBot",
    tag: "COMPUTER VISION",
    accent: "#16a085",
    bg: "#0a1a1a",
    bars: [
      { label: "Tensor transformation [1,3,224,224]", year: "2024", width: "92%" },
      { label: "Spatial feature extraction", year: "2025", width: "86%" },
      { label: "Visual classification", year: "2024", width: "94%" },
      { label: "Salience bounding grid", year: "2025", width: "78%" },
    ],
  },
  {
    title: "ResearchBot",
    tag: "RESEARCH",
    accent: "#2980b9",
    bg: "#0a0a1a",
    bars: [
      { label: "Literature synthesis", year: "2024", width: "88%" },
      { label: "Semantic citation ranking", year: "2025", width: "91%" },
      { label: "Fact-checked verification", year: "2024", width: "85%" },
      { label: "Thematic decomposition", year: "2025", width: "80%" },
    ],
  },
  {
    title: "DataBot",
    tag: "DATA SCIENCE",
    accent: "#27ae60",
    bg: "#0a1a0a",
    bars: [
      { label: "Matrix distribution profiling", year: "2024", width: "90%" },
      { label: "Z-score outlier isolation", year: "2025", width: "86%" },
      { label: "Correlation matrix computation", year: "2024", width: "92%" },
      { label: "Statistical variance scan", year: "2025", width: "84%" },
    ],
  },
  {
    title: "DocumentBot",
    tag: "DOCUMENTS",
    accent: "#d35400",
    bg: "#1a0a1a",
    bars: [
      { label: "Hierarchical text extraction", year: "2024", width: "87%" },
      { label: "Multi-section summarization", year: "2025", width: "93%" },
      { label: "Table serialization", year: "2024", width: "82%" },
      { label: "Document layout alignment", year: "2025", width: "89%" },
    ],
  },
  {
    title: "StudyBot",
    tag: "EDUCATION",
    accent: "#8e44ad",
    bg: "#0d0d1a",
    bars: [
      { label: "Pedagogical deconstruction", year: "2024", width: "91%" },
      { label: "Step-by-step concept synthesis", year: "2025", width: "87%" },
      { label: "Learning verification checks", year: "2024", width: "94%" },
      { label: "Knowledge distillation", year: "2025", width: "80%" },
    ],
  },
];

function OrbitCardsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const animRef = useRef<number | null>(null);
  const angleRef = useRef(0);
  const hoveredRef = useRef<number | null>(null);

  useEffect(() => {
    const speed = 0.0028;
    const tick = () => {
      if (hoveredRef.current === null) {
        angleRef.current -= speed;
      }
      const radiusX = Math.min(420, window.innerWidth * 0.35);
      const radiusY = 170;
      const n = OQENS_ORBIT_CARDS.length;

      cardsRef.current.forEach((el, i) => {
        if (!el) return;
        const angle = angleRef.current + (i / n) * Math.PI * 2;
        const x = Math.cos(angle) * radiusX;
        const y = Math.sin(angle) * radiusY;
        const z = Math.sin(angle);
        const scale = 0.88 + (z + 1) * 0.12;
        const hoverScale = hoveredRef.current === i ? 1.05 : 1;

        el.style.transform = `translate(${x}px, ${y}px) scale(${scale * hoverScale})`;
        el.style.zIndex = String(Math.round((z + 1) * 50));
        el.style.opacity = String(0.4 + (z + 1) * 0.3);
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <section className="pt-20 pb-12 overflow-hidden bg-white" id="bots">
      <div className="text-center mb-6 px-6">
        <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">
          What we built
        </p>
        <h2
          className="font-medium tracking-tight text-black font-sans leading-[1.1]"
          style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          Seven specialized bots.
          <br />
          <em className="font-serif italic">One orchestration.</em>
        </h2>
      </div>

      <div className="relative w-full h-[540px] overflow-hidden flex items-center justify-center">
        {OQENS_ORBIT_CARDS.map((card, i) => (
          <div
            key={i}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            className="absolute w-[260px] h-[230px] rounded-[16px] overflow-hidden shadow-2xl transition-shadow cursor-pointer select-none"
            style={{
              background: card.bg,
              willChange: "transform, opacity",
            }}
            onMouseEnter={() => {
              hoveredRef.current = i;
            }}
            onMouseLeave={() => {
              hoveredRef.current = null;
            }}
          >
            <div className="flex flex-col h-full">
              {/* Card top */}
              <div className="flex-1 p-3 overflow-hidden">
                <div className="flex justify-between items-center mb-2 opacity-60">
                  <span
                    className="text-[9px] font-semibold tracking-wider uppercase font-mono"
                    style={{ color: card.accent }}
                  >
                    NANOBOT
                  </span>
                  <span className="text-[9px] text-white/50 font-mono">
                    {card.tag}
                  </span>
                </div>
                <div className="h-[1px] bg-white/10 mb-2" />

                {/* Progress bars */}
                <div className="space-y-1.5">
                  {card.bars.map((bar, j) => (
                    <div key={j}>
                      <div className="flex justify-between items-center mb-0.5 text-[8px] text-white/60 font-sans">
                        <span className="truncate">{bar.label}</span>
                        <span className="text-white/30 ml-1 shrink-0 font-mono">
                          {bar.year}
                        </span>
                      </div>
                      <div
                        className="h-3 rounded-[3px] flex items-center px-1.5"
                        style={{
                          width: bar.width,
                          backgroundColor: `${card.accent}cc`,
                        }}
                      >
                        <span className="text-[7px] text-white font-medium truncate">
                          {bar.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card footer */}
              <div className="bg-black px-3 py-2 flex items-center justify-between border-t border-white/10">
                <div className="text-white text-[13px] font-bold font-sans">
                  {card.title}
                </div>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: card.accent }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────── 6. FIVE STEPS STORYTELLING ("HOW IT WORKS") ─────────────────────── */

const OQENS_STEPS = [
  {
    num: "01",
    tag: "TASK INGESTION",
    title: "Describe your goal",
    desc: "Submit natural language queries, multi-file payloads, or source code snippets. The NLP pipeline parses intents, entities, and context vectors.",
    icon: ChatCircle,
    output: "Input Tokenized → Context Matrix Projected",
  },
  {
    num: "02",
    tag: "INTENT CLASSIFICATION",
    title: "AI routes the workflow",
    desc: "Neural classifiers evaluate the request and select the optimal bot unit. Dynamic DAG assembly creates an ordered execution sequence.",
    icon: Brain,
    output: "Bot Selected → DAG Topology Built",
  },
  {
    num: "03",
    tag: "NEURAL PROCESSING",
    title: "Multi-stage pipeline executes",
    desc: "From tensor reshaping and AST parsing to literature ranking and anomaly detection, each specialized model completes its domain pass.",
    icon: Cpu,
    output: "Forward Pass Completed → Latency < 100ms",
  },
  {
    num: "04",
    tag: "QUALITY VALIDATION",
    title: "Confidence score is verified",
    desc: "Automated validation gates run cross-checks and salience tests. Result anomalies are flagged and recalibrated prior to final output.",
    icon: ShieldCheck,
    output: "Validation Gate: PASSED (0.96 Confidence)",
  },
  {
    num: "05",
    tag: "LIVE STREAMING",
    title: "You get the live result",
    desc: "Server-Sent Events broadcast layer telemetry, execution steps, and structured payloads directly to your screen with zero delay.",
    icon: Broadcast,
    output: "Payload Broadcast → UI Rendered",
  },
];

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how" className="py-24 bg-[#FAFAFA] border-y border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center md:text-left mb-12">
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">
            How it works
          </p>
          <h2
            className="font-medium tracking-tight text-black font-sans leading-tight"
            style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
          >
            Five steps.
            <br />
            <span className="italic font-serif">One seamless execution.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Step List */}
          <div className="space-y-3">
            {OQENS_STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full text-left p-5 rounded-2xl transition-all duration-200 border ${
                  activeStep === i
                    ? "bg-white border-black shadow-sm"
                    : "bg-white/60 border-[#EBEBEB] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                    STEP {step.num} · {step.tag}
                  </span>
                  {activeStep === i && (
                    <div className="w-2 h-2 rounded-full bg-black" />
                  )}
                </div>
                <h3 className="text-[17px] font-semibold text-black font-sans mb-1">
                  {step.title}
                </h3>
                {activeStep === i && (
                  <p className="text-[13px] text-neutral-600 leading-relaxed font-sans mt-2">
                    {step.desc}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Right Synchronized Interactive Card */}
          <div className="bg-white border border-[#EBEBEB] rounded-3xl p-8 shadow-sm flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EBEBEB] mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A3FF6F] animate-pulse-dot" />
                  <span className="text-[11px] font-mono uppercase text-neutral-400">
                    LIVE EXECUTION SIMULATION
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-black">
                  STAGE {OQENS_STEPS[activeStep].num} / 05
                </span>
              </div>

              <div className="space-y-4">
                <div className="text-[24px] font-semibold text-black font-sans">
                  {OQENS_STEPS[activeStep].title}
                </div>
                <p className="text-[14px] text-neutral-600 font-sans leading-relaxed">
                  {OQENS_STEPS[activeStep].desc}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#EBEBEB] bg-[#FAFAFA] -mx-8 -mb-8 p-6 rounded-b-3xl">
              <div className="text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Telemetry Output
              </div>
              <div className="text-[13px] font-mono font-medium text-black">
                {OQENS_STEPS[activeStep].output}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 7. "BUILT DIFFERENT" (ASYMMETRIC GRID) ─────────────────────── */

const PILLARS = [
  {
    title: "Multi-Bot Orchestration",
    desc: "Autonomous DAG assembly routes complex tasks across specialized neural units without manual configuration.",
    icon: TreeStructure,
  },
  {
    title: "Deterministic Execution",
    desc: "Every step is traceable, reproducible, and validated against strict quality constraints.",
    icon: ShieldCheck,
  },
  {
    title: "Real-Time Telemetry",
    desc: "Streamed Server-Sent Events deliver sub-millisecond layer timings, weights, and metrics.",
    icon: Broadcast,
  },
  {
    title: "Zero Black-Box Logic",
    desc: "Inspect full AST syntax trees, salience bounding boxes, and intermediate embeddings in real time.",
    icon: Eye,
  },
];

function BuiltDifferentSection() {
  return (
    <section className="py-24 bg-white border-b border-[#EBEBEB]" id="execution">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center md:text-left mb-12">
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">
            Architecture
          </p>
          <h2
            className="font-medium tracking-tight text-black font-sans leading-tight"
            style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
          >
            Built different.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="p-8 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] hover:border-black transition-colors duration-200"
              >
                <div className="h-11 w-11 rounded-2xl bg-white border border-[#EBEBEB] flex items-center justify-center mb-6 shadow-2xs">
                  <Icon weight="bold" className="h-5 w-5 text-black" />
                </div>
                <h3 className="text-[20px] font-semibold text-black font-sans mb-2">
                  {pillar.title}
                </h3>
                <p className="text-[14px] text-neutral-600 font-sans leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 8. COMPARISON TABLE ("NOT ALL SEARCH IS EQUAL") ─────────────────────── */

const COMPARISON_ITEMS = [
  { feature: "Multi-bot autonomous routing", manual: false, single: false, nano: true },
  { feature: "Deterministic execution DAGs", manual: false, single: false, nano: true },
  { feature: "Live layer telemetry & streaming", manual: false, single: "Partial", nano: true },
  { feature: "Modular deep-learning pipelines", manual: false, single: false, nano: true },
  { feature: "Real-time confidence scoring", manual: false, single: "Partial", nano: true },
  { feature: "Zero data leakage / self-hostable", manual: true, single: false, nano: true },
];

function ComparisonSection() {
  const renderValue = (val: boolean | string) => {
    if (val === true)
      return <CheckCircle weight="fill" className="h-5 w-5 text-black mx-auto" />;
    if (val === "Partial")
      return <span className="text-[12px] text-neutral-400 font-sans">Partial</span>;
    return <span className="text-neutral-300 font-mono">—</span>;
  };

  return (
    <section className="py-24 bg-[#FAFAFA] border-b border-[#EBEBEB]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">
            Better execution
          </p>
          <h2
            className="font-medium tracking-tight text-black font-sans"
            style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
          >
            Not all workflows are equal.
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-[#EBEBEB] overflow-hidden shadow-xs">
          <table className="w-full text-[13px] font-sans">
            <thead>
              <tr className="border-b border-[#EBEBEB]">
                <th className="text-left py-4 px-6 font-medium text-neutral-500">
                  Feature
                </th>
                <th className="py-4 px-4 font-medium text-neutral-400 text-center w-28">
                  Manual
                </th>
                <th className="py-4 px-4 font-medium text-neutral-400 text-center w-28">
                  Single Model
                </th>
                <th className="py-4 px-4 font-bold text-black text-center w-28 bg-[#FAFAFA]">
                  NanoBot
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ITEMS.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[#F0F0F0] last:border-0 ${
                    i % 2 === 1 ? "bg-[#FAFAFA]/50" : ""
                  }`}
                >
                  <td className="py-4 px-6 font-medium text-black">{row.feature}</td>
                  <td className="py-4 px-4 text-center">{renderValue(row.manual)}</td>
                  <td className="py-4 px-4 text-center">{renderValue(row.single)}</td>
                  <td className="py-4 px-4 text-center bg-[#FAFAFA]">
                    {renderValue(row.nano)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 9. SAMPLE EXECUTABLE WORKFLOWS ─────────────────────── */

const SAMPLE_WORKFLOWS = [
  {
    title: "High-Frequency Trading Feature Pipeline",
    bot: "DataBot",
    tag: "DATA SCIENCE",
    desc: "Calculate rolling Z-scores, multi-dimensional covariance matrix, and outlier flags on 10,000 tick events.",
  },
  {
    title: "Static Security AST Audit & Refactoring",
    bot: "CodeBot",
    tag: "ENGINEERING",
    desc: "Parse Abstract Syntax Tree, evaluate cyclomatic complexity, and detect insecure deserialization vulnerabilities.",
  },
  {
    title: "Multi-Scale Visual Salience Tensor Extraction",
    bot: "VisionBot",
    tag: "VISION",
    desc: "Normalize 4D image tensor bounds, compute spatial gradients, and generate bounding salience heatmaps.",
  },
  {
    title: "Thematic Literature Synthesis & Fact Check",
    bot: "ResearchBot",
    tag: "RESEARCH",
    desc: "Decompose complex scientific queries, rank citations, and verify factual assertions across verified corpora.",
  },
];

function SampleWorkflowsSection() {
  return (
    <section className="py-24 bg-white border-b border-[#EBEBEB]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center md:text-left mb-12">
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">
            For developers & teams
          </p>
          <h2
            className="font-medium tracking-tight text-black font-sans"
            style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
          >
            Try these workflows
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SAMPLE_WORKFLOWS.map((wf, i) => (
            <Link
              key={i}
              href="/app/overview"
              className="p-6 rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">
                    {wf.tag}
                  </span>
                  <span className="text-xs font-mono text-neutral-500 font-medium">
                    {wf.bot}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-black font-sans group-hover:text-black transition-colors mb-2">
                  {wf.title}
                </h3>
                <p className="text-[13px] text-neutral-600 font-sans leading-relaxed">
                  {wf.desc}
                </p>
              </div>
              <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-black font-sans group-hover:gap-2 transition-all">
                <span>Run workflow</span>
                <ArrowRight weight="bold" className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 10. FAQ ACCORDION ("COMMON QUESTIONS") ─────────────────────── */

const FAQS = [
  {
    q: "How does multi-bot orchestration differ from single LLM prompts?",
    a: "Unlike a single monolithic model, NanoBot routes specific sub-tasks to specialized neural engines (e.g. AST analyzers, PyTorch vision transforms, tabular matrix processors). Each engine executes deterministically with structured telemetry.",
  },
  {
    q: "Is execution truly transparent?",
    a: "Yes. NanoBot streams every layer completion, millisecond execution timestamp, and intermediate artifact via Server-Sent Events (SSE). Nothing is hidden behind a black-box simulator.",
  },
  {
    q: "Can I connect my own AI keys and models?",
    a: "Yes. You can supply your own Groq, OpenRouter, or OpenAI API keys in Settings. NanoBot uses the configured key with high-speed neural synthesis.",
  },
  {
    q: "How do I start a persistent reasoning session?",
    a: "Navigate to the Conversations tab in the workspace, pick from any of the 7 canonical bots (ChatBot, CodeBot, VisionBot, etc.), and engage in interactive, multi-turn reasoning.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-[#FAFAFA] border-b border-[#EBEBEB]" id="faq">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-400 mb-2 font-mono">
            Support
          </p>
          <h2
            className="font-medium tracking-tight text-black font-sans"
            style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
          >
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="border border-[#EBEBEB] rounded-2xl bg-white overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4"
                >
                  <span className="text-[15px] font-semibold text-black font-sans">
                    {faq.q}
                  </span>
                  <div className="h-6 w-6 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    {isOpen ? (
                      <Minus className="h-3.5 w-3.5 text-black" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-black" />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-[13px] text-neutral-600 font-sans leading-relaxed border-t border-[#F0F0F0]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── 11. FINAL OQENS CTA ("START SEARCHING SMARTER") ─────────────────────── */

function FinalCTASection() {
  return (
    <section className="py-32 bg-white text-center px-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center border border-[#EBEBEB] rounded-full px-3.5 py-1 text-xs text-neutral-500 mb-6 font-mono">
          Join the beta · Instant access
        </div>

        <h2
          className="font-medium tracking-tight italic font-serif text-black leading-tight mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Start executing smarter.
        </h2>

        <p className="text-[17px] text-neutral-600 max-w-md mx-auto mb-10 leading-relaxed font-sans">
          One platform for intelligent task execution. Connect your models and
          experience multi-bot orchestration today.
        </p>

        <Link
          href="/app/overview"
          className="inline-flex items-center justify-center transition-all duration-200 h-12 px-8 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-sm font-medium tracking-tight shadow-md gap-2"
        >
          <span>Try NanoBot →</span>
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────── 12. CLEAN MINIMAL FOOTER ─────────────────────── */

function Footer() {
  return (
    <footer className="bg-white border-t border-[#EBEBEB] py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-[13px] font-sans">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-6 rounded bg-black text-white flex items-center justify-center font-mono text-xs font-bold">
              N
            </div>
            <span className="font-semibold text-black">NanoBot</span>
          </div>
          <p className="text-neutral-500 leading-relaxed text-xs">
            AI agents, knowledge, and workflow automation — with an assistant for
            your inbox, calendar, and tasks.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider font-mono">
            Platform
          </h4>
          <ul className="space-y-2 text-neutral-500 text-xs">
            <li><Link href="/app/overview" className="hover:text-black transition-colors">Overview</Link></li>
            <li><Link href="/app/workflows" className="hover:text-black transition-colors">Workflows</Link></li>
            <li><Link href="/app/automations" className="hover:text-black transition-colors">Automations</Link></li>
            <li><Link href="/app/executions" className="hover:text-black transition-colors">Executions</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider font-mono">
            Assistant
          </h4>
          <ul className="space-y-2 text-neutral-500 text-xs">
            <li><Link href="/app/inbox" className="hover:text-black transition-colors">Inbox</Link></li>
            <li><Link href="/app/calendar" className="hover:text-black transition-colors">Calendar</Link></li>
            <li><Link href="/app/knowledge" className="hover:text-black transition-colors">Knowledge</Link></li>
            <li><Link href="/app/connected-accounts" className="hover:text-black transition-colors">Connected Accounts</Link></li>
          </ul>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-black mb-3 text-xs uppercase tracking-wider font-mono">
              Status
            </h4>
            <div className="flex items-center gap-2 text-neutral-600 text-xs">
              <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse-dot" />
              <span>All systems operational</span>
            </div>
          </div>
          <p className="text-neutral-400 mt-6 text-[11px] font-mono">
            © {new Date().getFullYear()} NanoBot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── MAIN EXPORT ─────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <TopMarquee />
      <Header />
      <HeroSection />
      <PartnerMarquee />
      <AnimatedSearchExperience />
      <OrbitCardsSection />
      <HowItWorksSection />
      <BuiltDifferentSection />
      <ComparisonSection />
      <SampleWorkflowsSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
