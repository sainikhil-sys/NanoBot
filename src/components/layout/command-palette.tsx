"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  ChatCircle,
  Robot,
  TreeStructure,
  Lightning,
  UploadSimple,
  Books,
  Pulse,
  ClockCounterClockwise,
  Scroll,
  Gear,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";

interface CommandItem {
  id: string;
  title: string;
  category: "Actions" | "Navigation" | "Capabilities";
  icon: React.ComponentType<{ className?: string; weight?: "bold" | "regular" | "fill" }>;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const commands: CommandItem[] = [
    {
      id: "new-chat",
      title: "New Chat",
      category: "Actions",
      icon: ChatCircle,
      href: "/app/overview",
      shortcut: "N",
    },
    {
      id: "create-agent",
      title: "Create Custom Agent",
      category: "Actions",
      icon: Robot,
      href: "/app/bots",
      shortcut: "A",
    },
    {
      id: "create-workflow",
      title: "Create Workflow Pipeline",
      category: "Actions",
      icon: TreeStructure,
      href: "/app/workflows",
      shortcut: "W",
    },
    {
      id: "create-automation",
      title: "Create Automation Schedule",
      category: "Actions",
      icon: Lightning,
      href: "/app/automations",
      shortcut: "T",
    },
    {
      id: "upload-file",
      title: "Upload Documents / Files",
      category: "Actions",
      icon: UploadSimple,
      href: "/app/files",
      shortcut: "U",
    },
    {
      id: "nav-overview",
      title: "Workspace Overview",
      category: "Navigation",
      icon: Sparkle,
      href: "/app/overview",
    },
    {
      id: "nav-knowledge",
      title: "Knowledge Bases & RAG",
      category: "Navigation",
      icon: Books,
      href: "/app/knowledge",
    },
    {
      id: "nav-embeddings",
      title: "Word to Vector Inspector",
      category: "Navigation",
      icon: Pulse,
      href: "/app/embeddings",
    },
    {
      id: "nav-executions",
      title: "Execution Center",
      category: "Navigation",
      icon: ClockCounterClockwise,
      href: "/app/executions",
    },
    {
      id: "nav-logs",
      title: "System Logs & Telemetry",
      category: "Navigation",
      icon: Scroll,
      href: "/app/logs",
    },
    {
      id: "nav-settings",
      title: "Workspace Settings",
      category: "Navigation",
      icon: Gear,
      href: "/app/settings",
    },
  ];

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (item: CommandItem) => {
    setIsOpen(false);
    setSearch("");
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#E5E7EB] bg-white">
          <MagnifyingGlass className="h-4 w-4 text-[#6B7280] shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Type a command or search workspace..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDownList}
            autoFocus
            className="flex-1 bg-transparent text-sm text-black placeholder:text-[#9CA3AF] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-[#6B7280] bg-[#FAFAFA] border border-[#E5E7EB] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#6B7280] font-sans">
              No matching commands or actions found.
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-black text-white"
                      : "text-black hover:bg-[#FAFAFA]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isSelected ? "text-[#16A34A]" : "text-[#6B7280]"
                      }`}
                    />
                    <span className="font-medium truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-neutral-800 text-neutral-300"
                          : "bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]"
                      }`}
                    >
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-neutral-800 text-neutral-300"
                            : "bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB]"
                        }`}
                      >
                        ⌘{item.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between text-[11px] text-[#6B7280] font-mono">
          <span>Navigate with ↑↓, select with ↵</span>
          <span>NanoBot OS v2.0</span>
        </div>
      </div>
    </div>
  );
}
