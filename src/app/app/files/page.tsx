"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { AppFile } from "@/types/database.types";
import { formatDate, formatBytes } from "@/lib/utils";
import {
  FolderSimple,
  UploadSimple,
  FileText,
  Image as ImageIcon,
  FileCode,
} from "@phosphor-icons/react";

export default function FilesPage() {
  const [files, setFiles] = useState<AppFile[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadFiles() {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          path: `/uploads/${file.name}`,
        }),
      });

      if (res.ok) {
        loadFiles();
      }
    } catch (err) {
      console.error("Error saving file record", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-12 bg-white">
      <Header
        title="Files"
        description="Dataset, image, and document artifacts linked to execution pipelines"
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-500 font-sans">
            Files uploaded during task creation or attached to reasoning pipelines.
          </div>
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-medium bg-black text-white hover:bg-[#1A1A1A] shadow-2xs transition-colors">
            <UploadSimple weight="bold" className="h-3.5 w-3.5" />
            <span>Upload Artifact</span>
            <input type="file" onChange={handleUpload} className="hidden" />
          </label>
        </div>

        <div className="rounded-3xl border border-[#EBEBEB] bg-white overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#EBEBEB] flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderSimple className="h-4 w-4 text-neutral-500" />
              <h2 className="text-[16px] font-semibold text-black font-sans">
                Artifacts Storage
              </h2>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {files.length} Files
            </span>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-neutral-400 animate-pulse font-mono">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="text-sm font-semibold text-black font-sans">
                  No files uploaded yet.
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-sans leading-relaxed">
                  Files attached to tasks or uploaded here will appear in your workspace storage.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] font-sans">
                  <thead>
                    <tr className="border-b border-[#EBEBEB] bg-[#FAFAFA]/70">
                      <th className="text-left py-3.5 px-6 font-mono text-[11px] uppercase text-neutral-400 font-medium">File Name</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">MIME Type</th>
                      <th className="text-left py-3.5 px-4 font-mono text-[11px] uppercase text-neutral-400 font-medium">Size</th>
                      <th className="text-right py-3.5 px-6 font-mono text-[11px] uppercase text-neutral-400 font-medium">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f, idx) => (
                      <tr
                        key={f.id}
                        className={`hover:bg-[#FAFAFA] border-b border-[#F0F0F0] last:border-0 transition-colors ${
                          idx % 2 === 1 ? "bg-[#FAFAFA]/30" : ""
                        }`}
                      >
                        <td className="py-4 px-6 font-medium text-black flex items-center gap-2.5">
                          {f.mime_type.startsWith("image/") ? (
                            <ImageIcon className="h-4 w-4 text-neutral-500 shrink-0" />
                          ) : f.mime_type.includes("json") || f.mime_type.includes("csv") ? (
                            <FileCode className="h-4 w-4 text-neutral-500 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
                          )}
                          <span className="truncate">{f.name}</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-neutral-500">
                          {f.mime_type}
                        </td>
                        <td className="py-4 px-4 font-mono text-[11px] text-neutral-500">
                          {formatBytes(f.size)}
                        </td>
                        <td className="py-4 px-6 text-right text-neutral-400 text-[11px] font-mono">
                          {formatDate(f.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
