"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Users,
  Copy,
  Check,
  Search,
  LogOut,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
} from "lucide-react";

export default function AgentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [agent, setAgent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        const resAgent = await fetch("/api/agent/me");
        const dataAgent = await resAgent.json();
        if (resAgent.ok && dataAgent.success) {
          setAgent(dataAgent.agent);

          // Fetch Students registered under this agent
          const resStudents = await fetch("/api/agent/students");
          const dataStudents = await resStudents.json();
          if (resStudents.ok && dataStudents.success) {
            setStudents(dataStudents.students || []);
          }
          setLoading(false);
        } else {
          router.push("/agent/login");
        }
      } catch (err) {
        console.error("Agent dashboard load error:", err);
        router.push("/agent/login");
      }
    };
    fetchAgentData();
  }, [router]);

  const handleCopyCode = () => {
    if (!agent?.agentCode) return;
    navigator.clipboard.writeText(agent.agentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/agent/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/agent/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/agent/login");
    }
  };

  // Filter students by query
  const filteredStudents = students.filter((student) => {
    const term = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.registrationId.toLowerCase().includes(term) ||
      student.course.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans select-none">
        <div className="absolute w-[350px] h-[350px] rounded-full bg-deepskyblue/8 blur-[80px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/20 mb-2">
            <Sparkles className="h-6 w-6 text-white animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <p className="text-slate-500 text-sm font-bold tracking-wider uppercase animate-pulse">
            Verifying Agent Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[350px] h-[350px] rounded-full bg-deepskyblue/8 blur-[90px] top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-sky-400/5 blur-[100px] bottom-0 right-0" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-sm shadow-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-md shadow-deepskyblue/15 text-white font-extrabold text-lg">
            S
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">SUPPORT MISSION INDIA</h1>
            <p className="text-[9px] uppercase font-bold text-deepskyblue-dark tracking-wider mt-1">Associate Partner Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900">{agent?.name}</span>
            <span className="text-[10px] font-semibold text-slate-400">{agent?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-slate-600 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left column: Profile Card & Referral Code */}
        <section className="lg:col-span-4 space-y-8">

          {/* Agent Profile Details Card */}
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-200/25 p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="h-12 w-12 rounded-full bg-deepskyblue-light flex items-center justify-center text-deepskyblue-dark font-extrabold text-xl shadow-inner">
                {agent?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{agent?.name}</h2>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Approved Agent
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-650">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{agent?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{agent?.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Partner since: {new Date(agent?.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Referral Code Display */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-850 rounded-2xl shadow-xl shadow-slate-900/20 p-6 text-white space-y-6 relative overflow-hidden">
            {/* Ambient Background decoration */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-deepskyblue/10 blur-2xl" />

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-deepskyblue uppercase tracking-widest">Your Partner Referral Code</span>
              <h3 className="text-xs text-slate-400 leading-normal">
                Share this referral code with students. They must enter this code when signing up.
              </h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <span className="font-mono font-black text-xl text-deepskyblue tracking-wider">{agent?.agentCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-lg bg-deepskyblue hover:bg-deepskyblue-dark text-white font-bold text-xs transition-all active:scale-[0.95] flex items-center gap-1.5 cursor-pointer shadow-md shadow-deepskyblue/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-200/25 p-6 flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-deepskyblue-light flex items-center justify-center text-deepskyblue-dark shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Total Registered Students</span>
              <span className="text-3xl font-black text-slate-900 leading-none">{students.length}</span>
            </div>
          </div>

        </section>

        {/* Right column: Registered Students List */}
        <section className="lg:col-span-8 bg-white border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-200/25 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Referred Candidates Log</h2>
              <p className="text-slate-500 text-xs mt-1">Showing candidate enrollments linked to your referral code</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold">Candidate Info</th>
                  <th className="py-3.5 px-4 font-bold">Registration ID</th>
                  <th className="py-3.5 px-4 font-bold">Enrolled Program</th>
                  <th className="py-3.5 px-4 font-bold">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-850">{student.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 flex flex-col space-y-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 inline" /> {student.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 inline" /> {student.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono font-bold text-slate-900">
                        {student.registrationId}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-755">
                          <BookOpen className="h-3.5 w-3.5 text-deepskyblue flex-shrink-0" />
                          <span>{student.course}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        {new Date(student.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center font-bold text-slate-400">
                      No candidate registration logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

      </main>
    </div>
  );
}
