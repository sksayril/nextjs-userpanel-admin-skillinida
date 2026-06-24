"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, Shield } from "lucide-react";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin/dashboard");
      } else {
        setErrorMsg(data.error || "Authentication failed. Please check admin credentials.");
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
      {/* Soft Sky Blue Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[450px] h-[450px] rounded-full bg-deepskyblue/10 blur-[100px] -top-40 -left-20 animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute w-[450px] h-[450px] rounded-full bg-deepskyblue-dark/5 blur-[100px] -bottom-40 -right-20 animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 p-8 sm:p-10 transition-all duration-300 hover:shadow-deepskyblue/5 hover:border-slate-350">
          
          {/* Header Title */}
          <div className="flex flex-col items-center mb-8 text-center">
            <Logo iconSize="xl" className="mb-2" showText={false} />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-deepskyblue-dark to-sky-600 bg-clip-text text-transparent mt-1">
              Admin Portal Login
            </h1>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Support Mission India — Enter administrator details
            </p>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Login Fields */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@supportmissionindia.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
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
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm transition-all shadow-md shadow-deepskyblue/15 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Action */}
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            Setting up a new portal?{" "}
            <Link
              href="/admin/signup"
              className="font-bold text-deepskyblue hover:text-deepskyblue-dark hover:underline transition-colors"
            >
              Sign Up Admin
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
