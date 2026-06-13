"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, Shield, Mail } from "lucide-react";

export default function AdminSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("Admin account configured successfully! Directing to login...");
        setTimeout(() => {
          router.push("/admin/login");
        }, 2000);
      } else {
        setErrorMsg(data.error || "Failed to configure administrative setup.");
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
      {/* Background glowing ambient orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[450px] h-[450px] rounded-full bg-deepskyblue/10 blur-[100px] -top-40 -left-20 animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute w-[450px] h-[450px] rounded-full bg-deepskyblue-dark/5 blur-[100px] -bottom-40 -right-20 animate-pulse" style={{ animationDuration: "12s" }} />
      </div>

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 p-8 sm:p-10 transition-all duration-300 hover:shadow-deepskyblue/5 hover:border-slate-350">
          
          {/* Header section */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/25 mb-4 animate-pulse">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-deepskyblue-dark to-sky-600 bg-clip-text text-transparent">
              Register Admin
            </h1>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Support Mission India — Create elevated portal access
            </p>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-semibold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Admin Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm transition-all focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest">
                Admin Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
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
              <label htmlFor="password" className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest">
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
                  placeholder="Minimum 6 characters"
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
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Action */}
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            Already have administrative account?{" "}
            <Link
              href="/admin/login"
              className="font-bold text-deepskyblue hover:text-deepskyblue-dark hover:underline transition-colors"
            >
              Log In Admin
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
