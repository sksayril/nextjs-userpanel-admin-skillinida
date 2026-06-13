"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  BookOpen,
  FileText,
  User,
  TrendingUp,
  Award,
  ChevronRight,
  LogOut,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  ChevronDown
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("courses");
  const [loading, setLoading] = useState<boolean>(true);
  const [candidate, setCandidate] = useState<any>(null);

  // API Integrated States
  const [courseData, setCourseData] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({
    percentage: 100.0,
    present: 0,
    absent: 0,
    leave: 0,
    total: 0,
    days: []
  });
  const [papers, setPapers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);

  // Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);

  // Authenticate session and fetch dashboard data
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setCandidate(data.candidate);
          await fetchDashboardData();
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Course Modules
      const resCourse = await fetch("/api/courses/my-course");
      const dataCourse = await resCourse.json();
      if (resCourse.ok && dataCourse.success) {
        setCourseData(dataCourse.course);
        setModules(dataCourse.course.modules || []);
      }

      // 2. Fetch Attendance
      const resAttendance = await fetch("/api/attendance");
      const dataAttendance = await resAttendance.json();
      if (resAttendance.ok && dataAttendance.success) {
        setAttendance(dataAttendance.attendance);
      }

      // 3. Fetch Question Papers
      const resPapers = await fetch("/api/papers");
      const dataPapers = await resPapers.json();
      if (resPapers.ok && dataPapers.success) {
        setPapers(dataPapers.papers);
      }

      // 4. Fetch Quizzes
      const resQuizzes = await fetch("/api/quizzes");
      const dataQuizzes = await resQuizzes.json();
      if (resQuizzes.ok && dataQuizzes.success) {
        setQuizzes(dataQuizzes.quizzes);
      }

      // 5. Fetch Results
      const resResults = await fetch("/api/results");
      const dataResults = await resResults.json();
      if (resResults.ok && dataResults.success) {
        setResults(dataResults.results);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      router.push("/login");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Start Exam Quiz Handler
  const handleStartQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[questionIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnswers.includes(-1)) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmittingQuiz(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: activeQuiz._id,
          answers: selectedAnswers
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Quiz submitted successfully! Score: ${data.result.score}/${data.result.total} (${data.result.percentage}%) - Grade: ${data.result.grade}`);
        setActiveQuiz(null);
        await fetchDashboardData();
      } else {
        alert(data.error || "Failed to submit quiz answers.");
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
      alert("Network error submitting quiz answers.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Dynamic Results mapping into print Mark Sheet
  const resultsToDisplay = results.length > 0
    ? results.map((r, i) => {
        // Map quiz percentage directly into a standard 100-mark schema for print layout
        const code = `QUIZ-${101 + i}`;
        const internal = Math.round(r.score * (30 / r.total));
        const external = Math.round((r.total - r.score) * (70 / r.total)) + r.score * 5;
        const total = Math.round((r.score / r.total) * 100);
        return {
          code,
          subject: r.quizTitle,
          internal: internal > 30 ? 30 : internal,
          external: external > 70 ? 70 : external,
          total,
          grade: r.grade
        };
      })
    : [
        { code: "CS-101", subject: "Theoretical Principles", internal: 28, external: 66, total: 94, grade: "A+" },
        { code: "CS-102", subject: "Practical Applications Lab", internal: 26, external: 60, total: 86, grade: "A" },
        { code: "CS-103", subject: "Security & Auditing Essentials", internal: 22, external: 56, total: 78, grade: "B+" },
        { code: "CS-104", subject: "Final Term Capstone Project", internal: 28, external: 60, total: 88, grade: "A" }
      ];

  // Derive GPA
  const totalPercentage = results.length > 0
    ? results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length
    : 86.5;
  const weightedGpa = (totalPercentage / 10).toFixed(2);
  const finalStatus = totalPercentage >= 50 ? "PASS" : "FAIL";

  // Loading Screen Spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans select-none">
        <div className="absolute w-[350px] h-[350px] rounded-full bg-deepskyblue/8 blur-[80px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/20 mb-2">
            <Sparkles className="h-6 w-6 text-white animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <p className="text-slate-500 text-sm font-bold tracking-wider uppercase animate-pulse">
            Verifying Student Session...
          </p>
        </div>
      </div>
    );
  }

  // Derive avatar initials from candidate's name
  const avatarInitials = candidate.name
    ? candidate.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ST";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-x-hidden relative">
      
      {/* HEADER SECTION (Hidden when printing) */}
      <header className="h-16 border-b border-slate-200/80 backdrop-blur-md bg-white/80 sticky top-0 z-40 flex items-center justify-between px-6 print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-md shadow-deepskyblue/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-slate-900 hidden sm:inline-block text-sm">SUPPORT MISSION INDIA</span>
          <span className="font-extrabold tracking-tight text-slate-900 sm:hidden text-xs">SMI PANEL</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
            <Bell className="h-4 w-4 text-slate-600" />
            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-deepskyblue" />
          </button>
          {/* User Profile Summary */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-250">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
              {avatarInitials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-3">{candidate.name}</p>
              <p className="text-[9px] text-slate-400 font-semibold mt-1">{candidate.registrationId}</p>
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT CONTAINER */}
      <div className="flex-1 flex w-full relative">

        {/* DESKTOP SIDEBAR NAVIGATION (Hidden when printing & on Mobile view) */}
        <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between py-6 px-4 shrink-0 hidden lg:flex print:hidden">
          <div className="space-y-6">
            <div className="px-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Dashboard</p>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("courses")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "courses" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <BookOpen className="h-4 w-4" />
                <span>My Courses</span>
              </button>

              <button
                onClick={() => setActiveTab("attendance")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "attendance" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <Calendar className="h-4 w-4" />
                <span>My Attendance</span>
              </button>

              <button
                onClick={() => setActiveTab("papers")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "papers" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <FileText className="h-4 w-4" />
                <span>Question Paper</span>
              </button>

              <button
                onClick={() => setActiveTab("results")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "results" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <Award className="h-4 w-4" />
                <span>My Result & Marks</span>
              </button>

              <button
                onClick={() => setActiveTab("growth")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "growth" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>My Growth Chart</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "profile" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </button>
            </nav>
          </div>

          {/* Sign Out Action */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto mb-20 lg:mb-0 print:p-0 print:mb-0">
          
          {/* TAB CONTENT: MY COURSES */}
          {activeTab === "courses" && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-deepskyblue" />
                  My Enrolled Courses
                </h2>
                <p className="text-xs text-slate-500 mt-1">Review active syllabus modules and learning progress</p>
              </div>

              {/* Course Title Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-deepskyblue/12 to-sky-50/20 border border-deepskyblue/20 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 h-40 w-40 bg-deepskyblue/5 blur-2xl rounded-full" />
                <span className="text-[9px] uppercase font-bold bg-deepskyblue/10 text-deepskyblue-dark border border-deepskyblue/20 px-2 py-0.5 rounded-full">
                  Primary Program
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-3">{candidate.course}</h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Registered Student ID: {candidate.registrationId}</p>

                <div className="flex gap-4 items-center mt-6">
                  <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300/60">
                    <div className="h-full bg-gradient-to-r from-deepskyblue to-sky-600" style={{ width: "55%" }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">55% Overall</span>
                </div>
              </div>

              {/* Modules Progress Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {modules.map((mod, index) => (
                  <div key={index} className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-350 hover:shadow-md transition-all flex flex-col justify-between shadow-sm shadow-slate-100">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-slate-800">{mod.title}</h4>
                        <span className="text-xs font-bold text-deepskyblue-dark bg-deepskyblue/10 px-2 py-0.5 rounded-md">
                          {mod.progress}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{mod.topics}</p>
                    </div>

                    <div className="mt-5 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>Completion Rate</span>
                        <span>{mod.progress} / 100</span>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-deepskyblue to-sky-600" style={{ width: `${mod.progress}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MY ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-deepskyblue" />
                  My Lecture Attendance
                </h2>
                <p className="text-xs text-slate-500 mt-1">Monitor classroom presence and log history</p>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col items-center sm:items-start shadow-sm shadow-slate-100">
                  <span className="text-xs font-semibold text-slate-400">Attendance Rate</span>
                  <span className="text-2xl font-black text-deepskyblue-dark mt-1">{attendance.percentage}%</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col items-center sm:items-start shadow-sm shadow-slate-100">
                  <span className="text-xs font-semibold text-slate-400">Present Days</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1">{attendance.present} Lectures</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col items-center sm:items-start shadow-sm shadow-slate-100">
                  <span className="text-xs font-semibold text-slate-400">Absent Days</span>
                  <span className="text-2xl font-black text-rose-650 mt-1">{attendance.absent} Lectures</span>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col items-center sm:items-start shadow-sm shadow-slate-100">
                  <span className="text-xs font-semibold text-slate-400">Approved Leave</span>
                  <span className="text-2xl font-black text-amber-600 mt-1">{attendance.leave} Session</span>
                </div>
              </div>

              {/* Monthly Calendar View */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-100">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">
                  Attendance History Logs
                </h3>

                {attendance.days.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 font-medium">No lecture logs found in the database. Active attendance updates will be posted here by admin.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                    {attendance.days.map((dayObj: any, i: number) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          dayObj.status === "present"
                            ? "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100/50"
                            : dayObj.status === "absent"
                            ? "bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100/50"
                            : "bg-amber-50 border-amber-250 text-amber-700 hover:bg-amber-100/50"
                        }`}
                      >
                        <span className="text-xs font-bold">Day {dayObj.day}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider">
                          {dayObj.status === "present" ? "Pres" : dayObj.status === "absent" ? "Abs" : "Lv"}
                        </span>
                        {dayObj.googleMeetLink && (
                          <a
                            href={dayObj.googleMeetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 text-[8px] bg-deepskyblue px-1.5 py-0.5 rounded text-white border border-deepskyblue-dark/20 hover:bg-deepskyblue-dark font-bold transition-all shadow-sm"
                          >
                            Join Meet
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: QUESTION PAPER */}
          {activeTab === "papers" && (
            <div className="space-y-8 max-w-4xl animate-fade-in">
              {/* SECTION A: ONLINE TESTS */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-deepskyblue" />
                    Interactive Online Quiz Exams
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Complete online evaluations to update your semester mark sheet</p>
                </div>

                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl bg-white border border-slate-200/80 text-center font-medium shadow-sm shadow-slate-100">
                    No active online quizzes created for your course syllabus yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz, i) => {
                      const result = results.find(r => r.quizId === quiz._id);
                      return (
                        <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm shadow-slate-100">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              result ? "bg-emerald-50 border-emerald-150 text-emerald-600" : "bg-deepskyblue/10 border-deepskyblue/20 text-deepskyblue animate-pulse"
                            }`}>
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{quiz.title}</h4>
                              <p className="text-xs text-slate-400 mt-0.5 font-semibold">{quiz.questions.length} Objective Questions</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 justify-between sm:justify-end">
                            {result ? (
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-semibold">Grade</span>
                                <span className="text-xs text-emerald-650 font-bold">
                                  Score: {result.score}/{result.total} ({result.grade})
                                </span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartQuiz(quiz)}
                                className="py-1.5 px-4 rounded-lg bg-deepskyblue hover:bg-deepskyblue-dark text-xs font-bold text-white shadow-md shadow-deepskyblue/10 active:scale-95 cursor-pointer"
                              >
                                Start Exam
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION B: UPLOADED STATIC QUESTION PAPERS */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-deepskyblue" />
                    Syllabus Question Papers & Materials
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Download static exam question papers and syllabus packages</p>
                </div>

                {papers.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 rounded-xl bg-white border border-slate-200/80 text-center font-medium shadow-sm shadow-slate-100">
                    No static syllabus papers uploaded for your course yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {papers.map((paper, i) => (
                      <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm shadow-slate-100">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border bg-slate-50 border-slate-200 text-slate-450">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{paper.title}</h4>
                            <div className="flex gap-4 text-xs text-slate-400 mt-1 font-semibold">
                              <span>Status: {paper.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <a
                            href={paper.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="py-1.5 px-3 rounded-lg bg-slate-50 text-xs font-bold hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer transition-colors"
                          >
                            Download Paper
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MY RESULT & MARKS */}
          {activeTab === "results" && (
            <div className="space-y-6 max-w-4xl print:space-y-0 animate-fade-in">
              <div className="flex justify-between items-center print:hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-deepskyblue" />
                    My Results & Mark Sheet
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Download and inspect verified semester mark sheets</p>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Mark Sheet</span>
                </button>
              </div>

              {/* Printable Marksheet Container */}
              <div id="id-card-print-area" className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-250 shadow-xl relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-deepskyblue-light/20 print:bg-white print:border-none print:shadow-none print:text-black">
                
                {/* Print Title Header */}
                <div className="text-center border-b border-slate-200/80 pb-5 mb-6 print:border-zinc-300">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 print:text-black">
                    SUPPORT MISSION INDIA
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-deepskyblue-dark tracking-widest mt-1 print:text-zinc-600">
                    Sarkari Skill Certification Program
                  </p>
                  <h4 className="text-sm font-bold text-slate-700 mt-3 print:text-zinc-800">SEMESTER MARK SHEET</h4>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 text-xs border-b border-slate-100 pb-4 mb-6 print:border-zinc-200">
                  <div>
                    <span className="text-slate-400 block font-semibold">Candidate Name</span>
                    <span className="font-bold text-slate-800 print:text-black">{candidate.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Registration ID</span>
                    <span className="font-bold text-slate-800 print:text-black">{candidate.registrationId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Course Code</span>
                    <span className="font-bold text-deepskyblue-dark print:text-zinc-800">ADIT-2026</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 block font-semibold">Course Name</span>
                    <span className="font-semibold text-slate-700 print:text-black">{candidate.course}</span>
                  </div>
                </div>

                {/* Mark Sheet Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-450 uppercase text-[9px] tracking-wider print:border-zinc-300 print:text-zinc-500">
                        <th className="py-2.5">Code</th>
                        <th className="py-2.5">Subject Paper Exam</th>
                        <th className="py-2.5 text-center">Int (30)</th>
                        <th className="py-2.5 text-center">Ext (70)</th>
                        <th className="py-2.5 text-center">Total (100)</th>
                        <th className="py-2.5 text-right">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-zinc-200">
                      {resultsToDisplay.map((res, i) => (
                        <tr key={i} className="text-slate-700 print:text-black">
                          <td className="py-3 font-semibold text-slate-500 print:text-zinc-600">{res.code}</td>
                          <td className="py-3 font-medium text-slate-800">{res.subject}</td>
                          <td className="py-3 text-center">{res.internal}</td>
                          <td className="py-3 text-center">{res.external}</td>
                          <td className="py-3 text-center font-bold text-slate-900 print:text-black">{res.total}</td>
                          <td className="py-3 text-right font-black text-deepskyblue-dark print:text-zinc-800">{res.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Overall Summary Footer */}
                <div className="mt-8 pt-4 border-t border-slate-200/80 flex justify-between items-center print:border-zinc-300 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-500 print:text-zinc-600 font-medium">Result Status: <span className={`font-bold ${finalStatus === "PASS" ? "text-emerald-600 print:text-emerald-600" : "text-rose-600 print:text-rose-600"}`}>{finalStatus}</span></p>
                    <p className="text-slate-500 print:text-zinc-600 font-medium">Weighted GPA: <span className="text-slate-800 print:text-black font-bold">{weightedGpa} / 10.0</span></p>
                  </div>
                  
                  {/* Signature Mock */}
                  <div className="text-center relative">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 font-serif text-[10px] text-slate-400 select-none italic pointer-events-none opacity-40">
                      Dr. K. Verma
                    </div>
                    <div className="border-t border-slate-200 w-24 pt-1 text-[9px] text-slate-500 print:border-zinc-300 font-semibold">
                      Exam Controller
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT: MY GROWTH CHART */}
          {activeTab === "growth" && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-deepskyblue" />
                  My Academic Growth Chart
                </h2>
                <p className="text-xs text-slate-500 mt-1">Visual tracking of monthly assessment scores</p>
              </div>

              {/* SVG Glowing Line Graph */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 flex flex-col justify-between shadow-sm shadow-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-2">Internal Assessment Progression</h3>
                  <p className="text-xs text-slate-400 font-semibold">Exams conducted from January to June 2026</p>
                </div>

                <div className="w-full h-64 mt-6 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-between pointer-events-none border-b border-slate-100">
                    <div className="w-full border-t border-slate-100 h-[1px]" />
                    <div className="w-full border-t border-slate-100 h-[1px]" />
                    <div className="w-full border-t border-slate-100 h-[1px]" />
                    <div className="w-full border-t border-slate-100 h-[1px]" />
                  </div>

                  {/* Main SVG Graph */}
                  <svg className="w-full h-full overflow-visible relative z-10" viewBox="0 0 600 220" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00bfff" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gradient Fill under line */}
                    <path
                      d="M 10 180 Q 120 160 230 130 T 450 90 T 590 60 L 590 220 L 10 220 Z"
                      fill="url(#chart-glow)"
                    />

                    {/* Glowing Stroke line */}
                    <path
                      d="M 10 180 Q 120 160 230 130 T 450 90 T 590 60"
                      fill="none"
                      stroke="url(#gradient-line)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00bfff" />
                      <stop offset="50%" stopColor="#0099cc" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>

                    {/* Data Nodes */}
                    <circle cx="10" cy="180" r="5" className="fill-deepskyblue stroke-white stroke-[2.5]" />
                    <circle cx="128" cy="164" r="5" className="fill-deepskyblue stroke-white stroke-[2.5]" />
                    <circle cx="246" cy="132" r="5" className="fill-deepskyblue stroke-white stroke-[2.5]" />
                    <circle cx="364" cy="115" r="5" className="fill-deepskyblue stroke-white stroke-[2.5]" />
                    <circle cx="482" cy="85" r="5" className="fill-deepskyblue stroke-white stroke-[2.5]" />
                    <circle cx="590" cy="60" r="5" className="fill-deepskyblue stroke-white stroke-[2.5]" />
                  </svg>
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 mt-4 font-bold tracking-wider uppercase">
                  <span>Jan (70)</span>
                  <span>Feb (75)</span>
                  <span>Mar (82)</span>
                  <span>Apr (80)</span>
                  <span>May (88)</span>
                  <span>Jun (92)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: MY PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-deepskyblue" />
                  My Student Profile
                </h2>
                <p className="text-xs text-slate-500 mt-1">Review your registered admission records and details</p>
              </div>

              {/* Detail Profile Panel */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 space-y-6 shadow-sm shadow-slate-100">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 pb-6">
                  {/* Photo Initials */}
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-deepskyblue/10 animate-pulse">
                    {avatarInitials}
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold text-slate-800">{candidate.name}</h3>
                    <p className="text-xs text-slate-450 mt-1 font-semibold">Student UID: {candidate.registrationId}</p>
                    <span className="inline-block mt-3 text-[10px] uppercase font-bold bg-deepskyblue/10 text-deepskyblue-dark border border-deepskyblue/20 px-2 py-0.5 rounded-full">
                      Admission Active
                    </span>
                  </div>
                </div>

                {/* Profile Fields List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs text-slate-700">
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Father&apos;s Name</span>
                    <span className="font-semibold text-slate-800">{candidate.fatherName}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mother&apos;s Name</span>
                    <span className="font-semibold text-slate-800">{candidate.motherName}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{new Date(candidate.dob).toLocaleDateString()}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email ID</span>
                    <span className="font-semibold text-slate-800">{candidate.email}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</span>
                    <span className="font-semibold text-slate-800">{candidate.phone}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Enrolled Program</span>
                    <span className="text-right truncate pl-4 font-semibold text-deepskyblue-dark">{candidate.course}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Registration Time</span>
                    <span className="font-semibold text-slate-800">{candidate.createdAt ? new Date(candidate.createdAt).toLocaleString() : "N/A"}</span>
                  </div>
                  <div className="py-2.5 border-b border-slate-100 sm:col-span-2 flex flex-col gap-2">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Permanent Address</span>
                    <span className="text-slate-600 font-medium break-words leading-relaxed">{candidate.address}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* INTERACTIVE QUIZ MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-250 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-left">
            <div className="flex justify-between items-start border-b border-slate-150 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">{activeQuiz.title}</h3>
                <p className="text-xs text-slate-400 mt-1 font-semibold">Course Cohort: {activeQuiz.course}</p>
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-slate-650 hover:text-slate-950 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                Close Exam
              </button>
            </div>

            <form onSubmit={handleSubmitQuiz} className="space-y-6">
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {activeQuiz.questions.map((question: any, qIdx: number) => (
                  <div key={qIdx} className="space-y-3 p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                    <h4 className="text-xs font-bold text-slate-800 leading-normal">
                      Q{qIdx + 1}. {question.questionText}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {question.options.map((opt: string, optIdx: number) => {
                        const isSelected = selectedAnswers[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-deepskyblue/10 border-deepskyblue text-deepskyblue-dark shadow-sm shadow-deepskyblue/10"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                            }`}
                          >
                            <span className="inline-block h-4 w-4 rounded-full border border-slate-300 mr-2 text-center text-[9px] font-black uppercase leading-4 bg-slate-50 select-none">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-slate-150 pt-4">
                <span className="text-xs text-slate-500 font-semibold">
                  {selectedAnswers.filter(a => a !== -1).length} of {activeQuiz.questions.length} Answered
                </span>

                <button
                  type="submit"
                  disabled={submittingQuiz || selectedAnswers.includes(-1)}
                  className="flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-xs shadow-md shadow-deepskyblue/15 disabled:opacity-50 cursor-pointer"
                >
                  {submittingQuiz ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit Answers</span>
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM MENU BAR */}
      <footer className="h-16 border-t border-slate-200/80 backdrop-blur-md bg-white/95 fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 lg:hidden print:hidden shadow-lg">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
            activeTab === "attendance" ? "text-deepskyblue-dark font-bold animate-pulse" : "text-slate-400 hover:text-slate-650"
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Attendance</span>
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
            activeTab === "courses" ? "text-deepskyblue-dark font-bold animate-pulse" : "text-slate-400 hover:text-slate-655"
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">My Courses</span>
        </button>

        <button
          onClick={() => setActiveTab("papers")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
            activeTab === "papers" ? "text-deepskyblue-dark font-bold animate-pulse" : "text-slate-400 hover:text-slate-655"
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Paper</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-colors cursor-pointer ${
            activeTab === "profile" ? "text-deepskyblue-dark font-bold animate-pulse" : "text-slate-400 hover:text-slate-655"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[9px] uppercase tracking-wider font-semibold">Profile</span>
        </button>
      </footer>

    </div>
  );
}
