"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkle, ArrowRight, ArrowLeft } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/auth-provider";

export default function ForgotPasswordPage() {
  const { resetPasswordRequest } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await resetPasswordRequest(email);

    if (resetError) {
      setError(resetError.message || "Failed to send reset link. Please try again.");
    } else {
      setSubmitted(true);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden font-sans text-neutral-900"
      style={{
        backgroundImage: "radial-gradient(circle, #D0D0D0 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-[#EBEBEB] bg-white p-8 shadow-xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex mx-auto h-10 w-10 rounded-xl bg-black text-white items-center justify-center shadow-xs">
            <Sparkle weight="bold" className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-black font-sans tracking-tight">
              Reset Password
            </h1>
            <p className="text-[13px] text-neutral-500 font-sans mt-0.5">
              Enter your email to receive a password reset link
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50 text-center space-y-3">
            <div className="text-xs font-semibold text-emerald-800">
              Reset link sent!
            </div>
            <p className="text-[12px] text-emerald-700 font-sans leading-relaxed">
              We sent a password reset email to <span className="font-bold">{email}</span>. Check your inbox to set a new password.
            </p>
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 underline mt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black font-sans">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center transition-all duration-200 h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Sending link..." : "Send Reset Link"}</span>
              <ArrowRight weight="bold" className="h-3.5 w-3.5" />
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
