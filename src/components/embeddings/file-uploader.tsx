"use client";

import React, { useRef, useState } from "react";
import {
  FileText,
  FilePdf,
  FileDoc,
  FileCode,
  UploadSimple,
  X,
} from "@phosphor-icons/react";

interface FileUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function FileUploader({
  selectedFile,
  onFileSelect,
  disabled = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorText(null);
    const validExtensions = [".pdf", ".docx", ".txt", ".md", ".markdown"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (validExtensions.includes(ext)) {
      onFileSelect(file);
    } else {
      setErrorText("Unsupported format. Please upload a PDF, DOCX, TXT, or MD file.");
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FilePdf className="h-6 w-6 text-red-500" weight="fill" />;
    if (ext === "docx") return <FileDoc className="h-6 w-6 text-blue-500" weight="fill" />;
    if (ext === "md" || ext === "markdown") return <FileCode className="h-6 w-6 text-[#16A34A]" weight="fill" />;
    return <FileText className="h-6 w-6 text-neutral-600" weight="fill" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] transition-all">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs shrink-0">
            {getFileIcon(selectedFile.name)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-semibold text-black truncate font-sans">
              {selectedFile.name}
            </span>
            <span className="text-[11px] font-mono text-[#6B7280]">
              {formatFileSize(selectedFile.size)} · Document Ready
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onFileSelect(null);
            setErrorText(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          disabled={disabled}
          className="p-1.5 rounded-lg text-[#6B7280] hover:text-black hover:bg-neutral-200/60 transition-colors disabled:opacity-40"
          title="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          disabled
            ? "border-neutral-200 bg-neutral-50/50 opacity-60 cursor-not-allowed"
            : "border-[#E5E7EB] hover:border-black bg-[#FAFAFA]/70 hover:bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,.markdown"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white border border-[#E5E7EB] text-[#6B7280] flex items-center justify-center shadow-2xs">
            <UploadSimple className="h-5 w-5 text-black" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-black font-sans">
              Drop your document here or <span className="text-[#16A34A] underline">browse files</span>
            </p>
            <p className="text-[11px] font-mono text-[#6B7280]">
              Supported formats: PDF, DOCX, TXT, MD (up to 20MB)
            </p>
          </div>
        </div>
      </div>

      {errorText && (
        <p className="text-xs text-rose-600 font-sans">{errorText}</p>
      )}
    </div>
  );
}
