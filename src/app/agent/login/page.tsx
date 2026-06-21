"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function AgentLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setErrorMsg("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setErrorMsg("Please enter email and password");
      return;
    }

    setLoginLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/agent/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMsg("Success! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/agent/dashboard");
        }, 1000);
      } else {
        setErrorMsg(result.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error authenticating credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 overflow-hidden font-sans py-12 px-4 sm:px-6">

      {/* Background Glowing Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-deepskyblue/10 blur-[100px] top-[-50px] left-[-50px]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-deepskyblue-dark/5 blur-[120px] bottom-[-100px] right-[-100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/95 border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/40 p-8 sm:p-10">

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/25 mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-deepskyblue-dark to-sky-600 bg-clip-text text-transparent">
              Associate Partner Login
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Support Mission India — Sign in to manage referred candidates
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="agent@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm transition-all duration-200 shadow-md shadow-deepskyblue/15 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Partner Log In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link href="/agent/signup" className="text-sm font-semibold text-slate-500 hover:text-deepskyblue transition-all">
              Don&apos;t have an agent account? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
