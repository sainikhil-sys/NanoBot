"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkle, ArrowRight, GoogleLogo } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/auth-provider";

export default function SignUpPage() {
  const router = useRouter();
  const { signUpWithEmail, signInWithOAuth } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get("error");
      const urlDesc = params.get("error_description");

      if (urlError) {
        if (urlError === "OAuthFailed" || urlError === "redirect_uri_mismatch") {
          setError(
            urlDesc
              ? `Google Sign-In failed: ${urlDesc}. Please verify the Google OAuth redirect URI in Google Cloud Console and Supabase.`
              : "Google Sign-In failed. OAuth configuration mismatch. Please verify the Google OAuth redirect URI."
          );
        } else {
          setError(urlDesc || `Authentication failed: ${urlError}`);
        }
      }
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await signUpWithEmail(email, password, displayName);

    if (authError) {
      setError(authError.message || "Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/app/overview");
    router.refresh();
  };

  const handleOAuth = async () => {
    setError(null);
    const { error: oAuthError } = await signInWithOAuth("google");
    if (oAuthError) {
      setError(oAuthError.message || "Failed to sign up with Google.");
    }
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
          <Link href="/" className="inline-flex mx-auto h-10 w-10 rounded-xl bg-black text-white items-center justify-center shadow-xs hover:scale-105 transition-transform">
            <Sparkle weight="bold" className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-black font-sans tracking-tight">
              Create an Account
            </h1>
            <p className="text-[13px] text-[#6B7280] font-sans mt-0.5">
              Join NanoBot to access AI assistant workspace
            </p>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleOAuth}
          className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] hover:bg-white hover:border-black text-xs font-medium text-black transition-colors shadow-2xs"
        >
          <GoogleLogo className="h-4 w-4 text-red-500" />
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#EBEBEB] w-full" />
          <span className="bg-white px-3 text-[11px] font-mono text-[#6B7280] uppercase absolute">
            or email
          </span>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-sans">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black font-sans">Display Name</label>
            <input
              placeholder="Engineering Lead"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-black font-sans">Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full h-10 px-3.5 rounded-xl border border-[#EBEBEB] bg-[#FAFAFA] text-xs font-sans text-black focus:bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center transition-all duration-200 h-10 px-5 rounded-full bg-black text-white hover:bg-[#1A1A1A] text-xs font-medium tracking-tight shadow-xs gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="text-center text-xs text-[#6B7280] font-sans">
          Already have an account?{" "}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-black underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
