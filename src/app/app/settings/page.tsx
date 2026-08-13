"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/providers/auth-provider";
import { User, Shield, Check } from "@phosphor-icons/react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "Engineering Lead");
  const [email] = useState(user?.email || "user@nanobot.app");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen pb-12 bg-white">
      <Header
        title="Settings"
        description="Platform configuration, profile preferences, and telemetry settings"
      />

      <main className="p-8 max-w-4xl mx-auto w-full space-y-8">
        {/* Profile Settings */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EBEBEB]">
            <User className="h-5 w-5 text-neutral-500" />
            <div>
              <h2 className="text-[17px] font-semibold text-black font-sans">
                Profile Preferences
              </h2>
              <p className="text-[12px] text-neutral-500 font-sans mt-0.5">
                Manage your authenticated identity and platform role
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-black font-sans">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-black font-sans">Email Address</label>
                <input
                  value={email}
                  disabled
                  className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#F5F5F5] font-mono text-xs text-neutral-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-sans">Platform Role:</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-[#EBEBEB] bg-[#FAFAFA] text-neutral-700 font-medium">
                  ADMINISTRATOR
                </span>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center transition-all duration-200 h-9 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-1.5"
              >
                {saved ? (
                  <>
                    <Check weight="bold" className="h-3.5 w-3.5" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security & Access */}
        <div className="rounded-3xl border border-[#EBEBEB] bg-white p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#EBEBEB]">
            <Shield className="h-5 w-5 text-neutral-500" />
            <div>
              <h2 className="text-[17px] font-semibold text-black font-sans">
                Security & Cryptography
              </h2>
              <p className="text-[12px] text-neutral-500 font-sans mt-0.5">
                Row Level Security policies and session authentication state
              </p>
            </div>
          </div>

          <div className="space-y-3 text-[13px] font-sans">
            <div className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <div className="font-semibold text-black">Row Level Security (RLS)</div>
                <div className="text-neutral-500 text-[11px] mt-0.5">
                  PostgreSQL database isolation enabled across all tables
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-[#EBEBEB] bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <div className="font-semibold text-black">Authentication Provider</div>
                <div className="text-neutral-500 text-[11px] mt-0.5">
                  Supabase Auth SSR Session Management
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border border-[#EBEBEB] bg-white text-neutral-700 font-medium">
                AUTHENTICATED
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
