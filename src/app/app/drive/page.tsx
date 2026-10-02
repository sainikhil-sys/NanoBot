"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  HardDrives,
  MagnifyingGlass,
  FileText,
  GoogleLogo,
  ArrowSquareOut,
  Sparkle,
  CheckCircle,
  FilePdf,
} from "@phosphor-icons/react";
import { DriveDocumentItem } from "@/types/database.types";

export default function DrivePage() {
  const [files, setFiles] = useState<DriveDocumentItem[]>([]);
  const [query, setQuery] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [summarizingFile, setSummarizingFile] = useState<DriveDocumentItem | null>(null);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchDrive = async (searchQuery: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/drive?query=${encodeURIComponent(searchQuery || "NanoBot")}`);
      const json = await res.json();
      if (json.success) {
        setFiles(json.files || []);
        setConnected(json.connected ?? true);
      }
    } catch (err) {
      console.error("Failed to search Drive:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchDrive("NanoBot");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchDrive(query);
  };

  const handleSummarize = async (file: DriveDocumentItem) => {
    setSummarizingFile(file);
    setSummaryResult(`Summarizing "${file.name}" using high-dimensional semantic analysis...`);
    try {
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, fileName: file.name }),
      });
      const json = await res.json();
      if (json.success) {
        setSummaryResult(json.summary);
      }
    } catch (err) {
      console.error("Failed to summarize document:", err);
      setSummaryResult("Unable to summarize document.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <Header
        title="Google Drive Document Intelligence"
        subtitle="Search, summarize, and connect your Google Drive documents to NanoBot AI personal memory."
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" weight="fill" />
            <span>{toastMessage}</span>
          </div>
        )}

        {!connected ? (
          <div className="p-12 rounded-3xl bg-neutral-900/60 border border-neutral-800 text-center max-w-xl mx-auto space-y-5 my-12">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800 text-white flex items-center justify-center mx-auto shadow-inner">
              <GoogleLogo className="w-8 h-8" weight="bold" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-neutral-100">Connect Google Drive</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Connect your Google Drive account to allow NanoBot to search files, read documentation, and provide grounded answers.
              </p>
            </div>
            <Link
              href="/app/connected-accounts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition"
            >
              <GoogleLogo className="w-4 h-4" weight="bold" />
              <span>Connect Google Drive</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search files in Google Drive (e.g. proposal, architecture, roadmap)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-hidden focus:border-amber-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-neutral-950 text-xs font-semibold transition shrink-0"
              >
                {loading ? "Searching..." : "Search Drive"}
              </button>
            </form>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.length === 0 ? (
                <div className="col-span-full p-12 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400 space-y-2">
                  <HardDrives className="w-8 h-8 text-neutral-400 mx-auto" />
                  <p>No Drive files found matching your search.</p>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-amber-400">
                          {file.mimeType.includes("pdf") ? (
                            <FilePdf className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-neutral-500 hover:text-neutral-300 transition"
                            title="Open in Drive"
                          >
                            <ArrowSquareOut className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-neutral-100 line-clamp-1">{file.name}</h4>
                        <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSummarize(file)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
                    >
                      <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Summarize Document</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Summarization Drawer / Modal */}
            {summarizingFile && (
              <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-amber-400" />
                    AI Summary for {summarizingFile.name}
                  </h3>
                  <button
                    onClick={() => setSummarizingFile(null)}
                    className="text-xs text-neutral-400 hover:text-neutral-200"
                  >
                    Close
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans">
                  {summaryResult}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
