"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  FolderSimple,
  Plus,
  FileText,
  ChatDots,
  Sparkle,
  Trash,
  ArrowRight,
} from "@phosphor-icons/react";

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  chatCount: number;
  fileCount: number;
  instructions: string;
  updatedAt: string;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: "proj-nanobot",
    name: "NanoBot Platform",
    description: "Core codebase architecture, API routes, and agent orchestrator DAGs.",
    chatCount: 14,
    fileCount: 8,
    instructions: "Always write strict TypeScript, follow clean feature architecture, and enforce Zod input validation.",
    updatedAt: "Today",
  },
  {
    id: "proj-[#A3FF6F]",
    name: "AI Neural Research",
    description: "Multi-agent paper benchmarking, vector similarity search, and pgvector HNSW indexing.",
    chatCount: 9,
    fileCount: 12,
    instructions: "Focus on academic rigor, provide citations, and output mathematical LaTeX formulas.",
    updatedAt: "2 days ago",
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newProjectName,
      description: newProjectDesc || "Custom workspace for AI tasks and documents.",
      chatCount: 0,
      fileCount: 0,
      instructions: "Be precise and provide grounded answers.",
      updatedAt: "Just now",
    };
    setProjects([newProj, ...projects]);
    setNewProjectName("");
    setNewProjectDesc("");
    setIsDialogOpen(false);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900">
      <Header
        title="Projects & Workspaces"
        description="Organize chats, uploaded files, and custom AI system instructions"
        actions={
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs transition-colors"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" />
            <span>New Project Workspace</span>
          </button>
        }
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">
        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] hover:bg-white hover:border-black p-7 transition-all shadow-xs space-y-6 group relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-2xs">
                    <FolderSimple weight="bold" className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-black tracking-tight">
                      {proj.name}
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Updated {proj.updatedAt}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteProject(proj.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-600 transition-opacity"
                  title="Delete Project"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[13px] text-neutral-600 leading-relaxed font-sans">
                {proj.description}
              </p>

              {/* Instructions Preview */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#EBEBEB] space-y-1">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-neutral-400 font-semibold">
                  <Sparkle className="h-3 w-3 text-black" />
                  <span>Custom System Instructions</span>
                </div>
                <p className="text-[12px] font-mono text-neutral-700 truncate">
                  &quot;{proj.instructions}&quot;
                </p>
              </div>

              {/* Stats & Open Action */}
              <div className="pt-3 border-t border-[#EBEBEB] flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
                  <span className="flex items-center gap-1">
                    <ChatDots className="h-3.5 w-3.5" />
                    <span>{proj.chatCount} chats</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{proj.fileCount} files</span>
                  </span>
                </div>

                <Link
                  href="/app/conversations"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-black hover:underline"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* New Project Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EBEBEB] rounded-3xl p-6 max-w-md w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-3">
              <h3 className="text-base font-bold text-black font-sans">
                Create New Project Workspace
              </h3>
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="text-neutral-400 hover:text-black text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-500 font-semibold block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js Refactor"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full h-10 px-3 border border-[#EBEBEB] rounded-xl text-xs font-sans text-black focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-neutral-500 font-semibold block mb-1">
                  Description
                </label>
                <textarea
                  placeholder="What is this workspace focused on?"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-[#EBEBEB] rounded-xl text-xs font-sans text-black focus:outline-none focus:border-black resize-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="w-full h-10 rounded-2xl bg-black text-white hover:bg-[#1A1A1A] font-medium text-xs tracking-tight transition-all disabled:opacity-40"
            >
              Create Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
