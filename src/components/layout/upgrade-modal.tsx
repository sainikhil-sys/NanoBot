"use client";

import React, { useState } from "react";
import { Check, Sparkle, X, ShieldCheck, Lightning } from "@phosphor-icons/react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setUpgrading(true);
    setTimeout(() => {
      setUpgrading(false);
      setUpgraded(true);
      setTimeout(() => {
        setUpgraded(false);
        onClose();
      }, 1200);
    }, 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn"
      style={{
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center shadow-2xs">
              <Sparkle weight="bold" className="h-5 w-5 text-[#16A34A]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black font-sans tracking-tight">
                Upgrade to NanoBot Pro
              </h3>
              <p className="text-xs text-[#6B7280] font-sans mt-0.5">
                Unlock higher AI limits, deep document analysis, and priority agent workflows.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pricing Comparison Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Plan */}
          <div className="p-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#6B7280] font-semibold">Current Plan</div>
              <div className="text-xl font-bold text-black font-sans">Free Plan</div>
              <div className="text-2xl font-bold font-mono text-black">
                ₹0 <span className="text-xs text-[#6B7280] font-normal">/ month</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs font-sans text-neutral-600">
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                <span>100 AI queries per month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                <span>Standard embedding models (384D)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                <span>Up to 5MB document uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#6B7280] shrink-0" />
                <span>Standard chat & conversation history</span>
              </li>
            </ul>

            <div className="pt-2">
              <div className="w-full py-2 px-3 rounded-xl bg-neutral-200/60 text-center text-xs font-medium text-[#6B7280] font-sans">
                Active Plan
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="p-5 rounded-xl border-2 border-[#16A34A] bg-[#F2FAF4] space-y-4 relative shadow-sm">
            <div className="absolute top-3.5 right-3.5 px-2 py-0.5 rounded-full bg-[#16A34A] text-white text-[9px] font-mono uppercase font-bold tracking-wider">
              Popular
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono uppercase text-[#16A34A] font-bold">Recommended</div>
              <div className="text-xl font-bold text-black font-sans">NanoBot Pro</div>
              <div className="text-2xl font-bold font-mono text-black">
                ₹799 <span className="text-xs text-[#6B7280] font-normal">/ month</span>
              </div>
            </div>

            <ul className="space-y-2 text-xs font-sans text-neutral-800">
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                <span className="font-medium">Unlimited AI queries & searches</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                <span>Advanced embedding models (1,536D)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                <span>Large file uploads (PDF, DOCX up to 50MB)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                <span>Word to Vector & pgvector storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check weight="bold" className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                <span>Live agent preview & priority workers</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={upgrading || upgraded}
                className="w-full inline-flex items-center justify-center transition-all duration-200 h-9 px-4 rounded-xl bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-1.5 disabled:opacity-50 font-sans"
              >
                <Lightning weight="fill" className="h-3.5 w-3.5 text-[#16A34A]" />
                <span>
                  {upgraded ? "Pro Plan Activated!" : upgrading ? "Processing..." : "Upgrade Now"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Guarantee Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-[#6B7280] pt-1">
          <ShieldCheck weight="fill" className="h-4 w-4 text-[#6B7280]" />
          <span>Encrypted payment processing · Cancel anytime in Settings</span>
        </div>
      </div>
    </div>
  );
}
