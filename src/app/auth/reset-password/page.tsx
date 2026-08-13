"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkle, ArrowRight } from "@phosphor-icons/react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword && password.length >= 8) {
      setSaved(true);
      setTimeout(() => router.push("/auth/sign-in"), 1500);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(circle, #D0D0D0 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#EBEBEB] bg-white p-8 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
            <Sparkle weight="bold" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-black font-sans tracking-tight">
              Create New Password
            </h1>
            <p className="text-[13px] text-neutral-500 font-sans mt-0.5">
              Enter your new secure password below
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black font-sans">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black font-sans">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saved}
            className="w-full inline-flex items-center justify-center transition-all duration-200 h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-2 mt-2"
          >
            <span>{saved ? "Password Updated" : "Update Password"}</span>
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
