"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Sun,
  Moon,
  Question,
} from "@phosphor-icons/react";
import { NotificationsPopover } from "./notifications-popover";
import { useAuth } from "@/components/providers/auth-provider";

interface HeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  action?: React.ReactNode;
}

export function Header({ title, description, actions, action }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const effectiveActions = actions || action;

  useEffect(() => {
    // Check initial dark mode state
    setIsDark(document.documentElement.classList.contains("dark"));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/app/conversations?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Nikhil";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "N";

  return (
    <header className="h-[68px] border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Left: Page Title or Global Search Input */}
      <div className="flex items-center gap-6 min-w-0">
        {title ? (
          <div className="flex flex-col gap-0.5 min-w-0">
            <h1 className="text-[17px] font-bold text-black leading-tight tracking-tight font-sans truncate">
              {title}
            </h1>
            {description && (
              <p className="text-[11px] text-[#6B7280] leading-tight font-sans truncate hidden sm:block">
                {description}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <MagnifyingGlass className="absolute left-3.5 h-4 w-4 text-[#6B7280] pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or ask anything..."
              className={`h-9 w-[260px] sm:w-[320px] pl-9 pr-8 rounded-xl border bg-[#FAFAFA] text-xs text-black placeholder:text-[#6B7280] focus:bg-white focus:outline-none transition-colors font-sans ${
                searchFocused ? "border-black shadow-2xs" : "border-[#E5E7EB]"
              }`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="absolute right-2.5 px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-white text-[9px] font-mono text-[#6B7280] pointer-events-none shadow-2xs">
              /
            </div>
          </form>
        )}
      </div>

      {/* Right Controls: Custom Actions + Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {title && (
          <form onSubmit={handleSearchSubmit} className="relative hidden md:flex items-center">
            <MagnifyingGlass className="absolute left-3.5 h-3.5 w-3.5 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or ask anything..."
              className={`h-8 w-[220px] pl-9 pr-8 rounded-xl border bg-[#FAFAFA] text-xs text-black placeholder:text-[#6B7280] focus:bg-white focus:outline-none transition-colors font-sans ${
                searchFocused ? "border-black shadow-2xs" : "border-[#E5E7EB]"
              }`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div className="absolute right-2 px-1.5 py-0.5 rounded border border-[#E5E7EB] bg-white text-[8px] font-mono text-[#6B7280] pointer-events-none">
              /
            </div>
          </form>
        )}

        {effectiveActions}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {/* Help */}
        <button
          type="button"
          onClick={() => router.push("/app/settings")}
          className="p-2 rounded-xl text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors"
          title="Help & Documentation"
        >
          <Question className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <NotificationsPopover />

        {/* User Avatar */}
        <div className="h-8 w-8 rounded-full bg-black text-white font-mono text-xs flex items-center justify-center font-bold shadow-2xs ml-1">
          {initials}
        </div>
      </div>
    </header>
  );
}
