"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Authentication failed. Please check credentials.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to auth servers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 text-slate-800 overflow-hidden font-sans select-none">
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-deepskyblue/10 blur-[100px] top-[-50px] left-[-50px] animate-drift-slow" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-deepskyblue-dark/5 blur-[120px] bottom-[-100px] right-[-100px] animate-drift-slower" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-sky-400/8 blur-[90px] top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 animate-drift-slowest" />
      </div>

      {/* Foreground Container */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="backdrop-blur-xl bg-white/95 border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/40 p-8 sm:p-10 transition-all duration-300 hover:shadow-deepskyblue/5 hover:border-slate-350">
          
          {/* Logo / Heading Section */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/25 mb-4 animate-pulse">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-deepskyblue-dark to-sky-600 bg-clip-text text-transparent">
              Student Portal Login
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Support Mission India — Enter credentials to verify session
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Registration ID or Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Registration ID or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="identifier"
                  type="text"
                  required
                  placeholder="SMI-2026-XXXX or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10 focus:bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm transition-all duration-200 focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10 focus:bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm transition-all duration-200 shadow-md shadow-deepskyblue/15 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none overflow-hidden cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation Link */}
          <div className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-deepskyblue hover:text-deepskyblue-dark hover:underline transition-colors"
            >
              Register Candidate
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
