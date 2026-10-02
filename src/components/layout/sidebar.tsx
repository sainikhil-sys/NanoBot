"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkle,
  MagnifyingGlass,
  ChatCircle,
  Robot,
  TreeStructure,
  Lightning,
  Plugs,
  Books,
  Folder,
  Pulse,
  ClockCounterClockwise,
  BookmarkSimple,
  ChartLine,
  Scroll,
  Gear,
  Plus,
  SignOut,
  CaretDown,
  X,
  List,
  EnvelopeSimple,
  Calendar,
  CheckSquare,
  HardDrives,
  LinkedinLogo,
  Sun,
  Brain,
  LinkSimpleHorizontal,
} from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/auth-provider";
import { UpgradeModal } from "./upgrade-modal";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string; weight?: "bold" | "regular" | "fill" }>;
  badge?: string;
}

const PERSONAL_NAV_ITEMS: NavItem[] = [
  { title: "Daily Briefing", href: "/app/overview", icon: Sun },
  { title: "Inbox", href: "/app/inbox", icon: EnvelopeSimple },
  { title: "Calendar", href: "/app/calendar", icon: Calendar },
  { title: "Tasks", href: "/app/tasks", icon: CheckSquare },
  { title: "Drive", href: "/app/drive", icon: HardDrives },
  { title: "LinkedIn", href: "/app/linkedin", icon: LinkedinLogo },
  { title: "Memory", href: "/app/memory", icon: Brain },
  { title: "Connected Accounts", href: "/app/connected-accounts", icon: LinkSimpleHorizontal },
];

const WORKSPACE_NAV_ITEMS: NavItem[] = [
  { title: "AI Search", href: "/app/conversations", icon: MagnifyingGlass },
  { title: "Agents", href: "/app/bots", icon: Robot },
  { title: "Workflows", href: "/app/workflows", icon: TreeStructure },
  { title: "Automations", href: "/app/automations", icon: Lightning },
  { title: "Integrations", href: "/app/integrations", icon: Plugs },
  { title: "Knowledge", href: "/app/knowledge", icon: Books },
  { title: "Files", href: "/app/files", icon: Folder },
  { title: "Embeddings", href: "/app/embeddings", icon: Pulse },
];

const ACTIVITY_NAV_ITEMS: NavItem[] = [
  { title: "History", href: "/app/history", icon: ClockCounterClockwise },
  { title: "Saved", href: "/app/saved", icon: BookmarkSimple },
  { title: "Executions", href: "/app/executions", icon: ChartLine },
  { title: "Logs", href: "/app/logs", icon: Scroll },
];

const SYSTEM_NAV_ITEMS: NavItem[] = [
  { title: "Settings", href: "/app/settings", icon: Gear },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Nikhil";

  const userInitials =
    displayName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "NB";

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };

  const renderNavList = (items: NavItem[]) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/app/overview" && pathname?.startsWith(item.href));

        return (
          <button
            key={item.href}
            type="button"
            onClick={() => handleNavClick(item.href)}
            className={`w-full flex items-center justify-between px-3 h-8 rounded-xl text-xs font-sans font-medium transition-colors ${
              isActive
                ? "bg-black text-white shadow-2xs font-semibold"
                : "text-[#4B5563] hover:text-black hover:bg-[#FAFAFA]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  isActive ? "text-[#16A34A]" : "text-[#6B7280]"
                }`}
                weight={isActive ? "bold" : "regular"}
              />
              <span className="truncate">{item.title}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white font-sans">
      {/* Top Header & Navigation */}
      <div className="flex flex-col min-h-0">
        {/* Brand Logo & New Chat */}
        <div className="h-[68px] px-5 border-b border-[#E5E7EB] flex items-center justify-between shrink-0">
          <Link href="/app/overview" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-mono text-sm font-bold shadow-2xs">
              N
            </div>
            <span className="text-[16px] font-bold text-black leading-tight tracking-tight font-sans">
              NanoBot
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleNavClick("/app/overview")}
              className="h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-colors shadow-2xs"
              title="New Chat"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden h-7 w-7 rounded-lg border border-[#E5E7EB] bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick("/app/overview")}
            className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium font-sans shadow-2xs transition-colors"
          >
            <Plus weight="bold" className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="px-3 space-y-4 overflow-y-auto flex-1 min-h-0 pb-4">
          {/* 1. Personal Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
              Personal
            </div>
            {renderNavList(PERSONAL_NAV_ITEMS)}
          </div>

          {/* 2. Workspace Section */}
          <div className="space-y-1 pt-1 border-t border-[#F3F4F6]">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
              Workspace
            </div>
            {renderNavList(WORKSPACE_NAV_ITEMS)}
          </div>

          {/* 2. Activity Section */}
          <div className="space-y-1 pt-1 border-t border-[#F3F4F6]">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
              Activity
            </div>
            {renderNavList(ACTIVITY_NAV_ITEMS)}
          </div>

          {/* 3. System Section */}
          <div className="space-y-1 pt-1 border-t border-[#F3F4F6]">
            <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
              System
            </div>
            {renderNavList(SYSTEM_NAV_ITEMS)}
          </div>
        </div>
      </div>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-[#E5E7EB] bg-white shrink-0 relative">
        <div
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center justify-between p-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-neutral-100 hover:border-black/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-black text-white flex items-center justify-center text-xs font-mono font-bold shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-xs font-semibold text-black truncate font-sans">
                {displayName}
              </div>
              <div className="text-[10px] font-mono text-[#16A34A] truncate flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                <span>Connected</span>
              </div>
            </div>
          </div>
          <CaretDown className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
        </div>

        {/* User Popup Menu */}
        {showUserMenu && (
          <div className="absolute bottom-16 left-3 right-3 bg-white rounded-2xl border border-[#E5E7EB] p-1.5 shadow-xl space-y-1 z-50 font-sans animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                handleNavClick("/app/settings");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-black hover:bg-[#FAFAFA] transition-colors"
            >
              <Gear className="h-3.5 w-3.5 text-[#6B7280]" />
              <span>Workspace Settings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                setShowUpgradeModal(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-black hover:bg-[#FAFAFA] transition-colors"
            >
              <Sparkle className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>Upgrade Plan</span>
            </button>
            <div className="border-t border-[#E5E7EB] my-1" />
            <button
              type="button"
              onClick={async () => {
                setShowUserMenu(false);
                await signOut();
                router.push("/auth/sign-in");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors"
            >
              <SignOut className="h-3.5 w-3.5 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Trigger (Rendered when sidebar is hidden on small screens) */}
      <div className="md:hidden fixed top-3 left-3 z-40">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="h-9 w-9 rounded-xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-center text-black"
        >
          <List className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-[280px] h-full bg-white shadow-2xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-[260px] border-r border-[#E5E7EB] bg-white flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
        {sidebarContent}
      </aside>
    </>
  );
}

