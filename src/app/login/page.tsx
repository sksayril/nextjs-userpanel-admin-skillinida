"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Course selection state (for multi-course accounts)
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [showCoursePicker, setShowCoursePicker] = useState(false);
  const [selectingCourse, setSelectingCourse] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setCourseOptions([]);
    setShowCoursePicker(false);

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
      } else if (data.courseSelection && data.courses) {
        // Multiple course registrations found — show course picker
        setCourseOptions(data.courses);
        setShowCoursePicker(true);
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

  const handleSelectCourse = async (courseId: string) => {
    setSelectingCourse(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, courseId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/dashboard");
      } else {
        setErrorMsg(data.error || "Failed to login to selected course.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to auth servers.");
    } finally {
      setSelectingCourse(false);
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
            <Logo iconSize="xl" className="mb-2" showText={false} />

            <h1 className="text-[22px] font-black tracking-tight text-[#0f172a] mt-1">
              SUPPORT MISSION INDIA
            </h1>
            <p className="text-[11px] font-bold mt-0.5" style={{ background: "linear-gradient(90deg,#FF9933,#138808)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Sabka Saath • Sabka Vikas • Sabka Mission
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {showCoursePicker ? "Select which course to access" : "Student Portal — Enter credentials to verify session"}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Course Selection View */}
          {showCoursePicker ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-semibold text-center">
                Your email is registered for multiple courses. Select which one to access:
              </p>
              <div className="space-y-3">
                {courseOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectCourse(option.id)}
                    disabled={selectingCourse || !option.isActive}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      !option.isActive
                        ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-slate-200 hover:border-deepskyblue hover:bg-deepskyblue/5 hover:shadow-md"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-deepskyblue to-sky-600 flex items-center justify-center text-white shrink-0">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="text-sm font-bold text-slate-800 block">{option.course}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{option.registrationId}</span>
                      {!option.isActive && (
                        <span className="text-[9px] text-rose-500 font-bold block mt-0.5">Access Disabled</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCoursePicker(false);
                  setCourseOptions([]);
                  setErrorMsg("");
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          ) : (
            <>
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
                      suppressHydrationWarning
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
                      suppressHydrationWarning
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
                  suppressHydrationWarning
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
            </>
          )}

        </div>
      </div>
    </div>
  );
}
