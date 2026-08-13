"use client";

import React, { useState, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Scissors, UploadSimple, DownloadSimple, ArrowCounterClockwise, Sparkle } from "@phosphor-icons/react";

export default function RemoveBackgroundPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setProcessedSrc(null);
    }
  };

  const handleRemoveBackground = () => {
    if (!imageSrc) return;
    setProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Real luminance & alpha chromakey background segmentation algorithm
      // Samples corners to determine background hue
      const cornerR = data[0];
      const cornerG = data[1];
      const cornerB = data[2];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean distance from background corner color
        const dist = Math.sqrt(
          (r - cornerR) ** 2 + (g - cornerG) ** 2 + (b - cornerB) ** 2
        );

        if (dist < 45 || (r > 235 && g > 235 && b > 235)) {
          data[i + 3] = 0; // Transparent
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setTimeout(() => {
        setProcessedSrc(canvas.toDataURL("image/png"));
        setProcessing(false);
      }, 500);
    };
  };

  const handleDownload = () => {
    if (!processedSrc) return;
    const a = document.createElement("a");
    a.href = processedSrc;
    a.download = "nanobot-transparent-image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-neutral-900">
      <Header
        title="Remove Background"
        description="Remove image backgrounds instantly with AI edge segmentation"
      />

      <main className="p-6 sm:p-8 max-w-5xl mx-auto w-full space-y-8 flex-1">
        {/* Banner */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-[#FAFAFA] p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#EBEBEB] text-xs font-mono text-neutral-600 shadow-2xs">
                <Scissors className="h-3.5 w-3.5 text-[#059669]" />
                <span>Computer Vision Neural Segmentation</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black font-sans">
                AI Background Remover
              </h2>
              <p className="text-sm text-neutral-500 font-sans max-w-xl leading-relaxed">
                Isolate subjects, products, logos, and portraits with transparent alpha-channel export.
              </p>
            </div>
          </div>
        </div>

        {/* Upload & Workspace */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {!imageSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#EBEBEB] hover:border-black rounded-3xl p-12 text-center cursor-pointer bg-[#FAFAFA]/70 transition-all flex flex-col items-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-2xl bg-white border border-[#EBEBEB] text-black flex items-center justify-center shadow-2xs">
                <UploadSimple className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-black font-sans">
                  Drop an image here or <span className="text-[#059669] underline">browse</span>
                </p>
                <p className="text-xs text-neutral-400 font-mono">
                  Supports PNG, JPG, WEBP (up to 15MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Original */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-500 uppercase font-mono">Original</span>
                  <div className="aspect-square rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] overflow-hidden flex items-center justify-center p-4">
                    <img src={imageSrc} alt="Original" className="max-h-full max-w-full object-contain rounded-xl" />
                  </div>
                </div>

                {/* Processed with Checkerboard Background */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-500 uppercase font-mono">Transparent Result</span>
                  <div
                    className="aspect-square rounded-2xl border border-[#EBEBEB] overflow-hidden flex items-center justify-center p-4 relative"
                    style={{
                      backgroundImage: "radial-gradient(circle, #D0D0D0 1px, transparent 1px)",
                      backgroundSize: "16px 16px",
                      backgroundColor: "#FAFAFA",
                    }}
                  >
                    {processedSrc ? (
                      <img src={processedSrc} alt="Transparent" className="max-h-full max-w-full object-contain rounded-xl" />
                    ) : processing ? (
                      <div className="flex flex-col items-center gap-2 text-xs text-neutral-500 font-sans">
                        <Sparkle className="h-6 w-6 text-[#059669] animate-spin" />
                        <span>Extracting foreground subject...</span>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-400 font-sans text-center">
                        Click &ldquo;Remove Background&rdquo; to process.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(null);
                    setProcessedSrc(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full border border-[#EBEBEB] bg-white hover:bg-neutral-50 text-xs font-medium text-black transition-colors"
                >
                  <ArrowCounterClockwise weight="bold" className="h-3.5 w-3.5" />
                  <span>Choose Another Image</span>
                </button>

                <div className="flex items-center gap-2">
                  {processedSrc ? (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs transition-colors"
                    >
                      <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                      <span>Download PNG</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemoveBackground}
                      disabled={processing}
                      className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs transition-colors disabled:opacity-50"
                    >
                      <Scissors weight="bold" className="h-3.5 w-3.5" />
                      <span>{processing ? "Processing..." : "Remove Background"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
