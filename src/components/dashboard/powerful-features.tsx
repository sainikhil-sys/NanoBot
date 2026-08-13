"use client";

import React from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  UploadSimple,
  Pulse,
  Scissors,
  ClockCounterClockwise,
  BookmarkSimple,
  ArrowRight,
} from "@phosphor-icons/react";

interface FeatureCard {
  title: string;
  description: string;
  href: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string; weight?: "bold" | "regular" | "fill" }>;
}

const FEATURES: FeatureCard[] = [
  {
    title: "AI Search",
    description: "Search the web in real-time and get accurate AI-powered answers.",
    href: "/app/conversations",
    badge: "New",
    icon: MagnifyingGlass,
  },
  {
    title: "Upload Files",
    description: "Upload documents, images, or PDFs and get instant insights.",
    href: "/app/upload",
    icon: UploadSimple,
  },
  {
    title: "Word to Vector",
    description: "Convert text or documents into vector embeddings.",
    href: "/app/embeddings",
    icon: Pulse,
  },
  {
    title: "Remove Background",
    description: "Remove image backgrounds instantly with AI.",
    href: "/app/remove-bg",
    icon: Scissors,
  },
  {
    title: "History",
    description: "View and manage your previous chats and searches.",
    href: "/app/history",
    icon: ClockCounterClockwise,
  },
  {
    title: "Saved",
    description: "Save important chats and results for quick access.",
    href: "/app/saved",
    icon: BookmarkSimple,
  },
];

export function PowerfulFeatures() {
  return (
    <section className="space-y-6 pt-4">
      <div className="text-center space-y-1.5 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black font-sans">
          Powerful Features
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] font-sans">
          Everything you need to work smarter and faster
        </p>
      </div>

      {/* 3-Column Grid on Desktop, 2-Column on Tablet, 1-Column on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group relative flex flex-col justify-between p-6 rounded-2xl border border-[#E5E7EB] bg-white hover:border-black/40 hover:shadow-sm transition-all duration-200 min-h-[190px]"
            >
              <div className="space-y-4">
                {/* Header with Icon and Badge */}
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-xl bg-black text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Icon weight="bold" className="h-5 w-5" />
                  </div>

                  {feature.badge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7EE] border border-[#16A34A]/20 text-[10px] font-mono uppercase text-[#16A34A] font-bold">
                      {feature.badge}
                    </span>
                  )}
                </div>

                {/* Title and Description */}
                <div className="space-y-1">
                  <h3 className="text-[16px] font-bold text-black font-sans transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] font-sans leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom Right Arrow */}
              <div className="flex items-center justify-end pt-3">
                <div className="h-7 w-7 rounded-full border border-[#E5E7EB] bg-[#FAFAFA] group-hover:bg-black group-hover:text-white group-hover:border-black flex items-center justify-center text-[#6B7280] transition-all">
                  <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
