"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  BookOpen,
  FileText,
  User,
  Award,
  ChevronRight,
  LogOut,
  Bell,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  ChevronDown,
  BookMarked
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

  // Print Target State
  const [printTarget, setPrintTarget] = useState<any>(null);

  // Exam Locker and Countdown States
  const [pendingQuiz, setPendingQuiz] = useState<any>(null);
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const activeQuizRef = React.useRef(activeQuiz);
  const selectedAnswersRef = React.useRef(selectedAnswers);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    if (!activeQuiz) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (activeQuizRef.current) {
            submitQuizAnswers(selectedAnswersRef.current, true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const startQuizWithQuestions = async (quizId: string) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const fullQuiz = data.quiz;
        setActiveQuiz(fullQuiz);
        setSelectedAnswers(new Array(fullQuiz.questions.length).fill(-1));
        setTimeRemaining(fullQuiz.duration ? fullQuiz.duration * 60 : 30 * 60);
        setPendingQuiz(null);
        setEnteredPassword("");
        setPasswordError("");
      } else {
        alert(data.error || "Failed to load exam questions. Make sure it has started.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error starting exam.");
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === pendingQuiz.examPassword) {
      await startQuizWithQuestions(pendingQuiz._id);
    } else {
      setPasswordError("Incorrect Exam Password. Please request the correct key from your administrator.");
    }
  };

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

  const triggerPrint = (type: "marksheet" | "certificate" | "cumulative_marksheet" | "admitcard", data: any) => {
    setPrintTarget({ type, data });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Start Exam Quiz Handler
  const handleStartQuiz = async (quiz: any) => {
    if (quiz.scheduledAt && new Date(quiz.scheduledAt) > new Date()) {
      alert("This exam has not started yet. Please wait until the scheduled start time.");
      return;
    }

    if (quiz.examPassword && quiz.examPassword.trim() !== "") {
      setPendingQuiz(quiz);
      setEnteredPassword("");
      setPasswordError("");
    } else {
      await startQuizWithQuestions(quiz._id);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[questionIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const submitQuizAnswers = async (answersToSubmit: number[], isAutoSubmit = false) => {
    setSubmittingQuiz(true);
    try {
      const targetQuiz = activeQuizRef.current || activeQuiz;
      if (!targetQuiz) return;
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: targetQuiz._id,
          answers: answersToSubmit
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (isAutoSubmit) {
          alert(`Time expired! Your exam was automatically submitted. Score: ${data.result.score}/${data.result.total} (${data.result.percentage}%) - Grade: ${data.result.grade}`);
        } else {
          alert(`Exam submitted successfully! Score: ${data.result.score}/${data.result.total} (${data.result.percentage}%) - Grade: ${data.result.grade}`);
        }
        setActiveQuiz(null);
        await fetchDashboardData();
      } else {
        alert(data.error || "Failed to submit answers.");
      }
    } catch (err) {
      console.error("Exam submission error:", err);
      alert("Network error submitting answers.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnswers.includes(-1)) {
      alert("Please answer all questions before submitting.");
      return;
    }
    await submitQuizAnswers(selectedAnswers, false);
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
          grade: r.grade,
          originalData: r
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


  const renderPrintAdmitCard = (student: any) => {
    if (!student) return null;
    
    // Extract ID details dynamically
    const regId = student.registrationId || "AGR/INSTR/2026/120033";
    const match = regId.match(/\d+$/);
    const lastDigits = match ? match[0] : "000000";
    const appId = regId;
    const rollNumber = `INSTR2026/${lastDigits}`;
    const acSuffix = lastDigits.length >= 3 ? lastDigits.slice(-3) : lastDigits;
    const admitCardNo = `AGR/INSTR/2026/AC000${acSuffix}`;
    
    const formattedDob = student.dob 
      ? new Date(student.dob).toLocaleDateString("en-GB").replace(/\//g, "-") 
      : "14-02-1997";
      
    const examDate = student.examDate 
      ? new Date(student.examDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) 
      : "25 June 2025 (Thursday)";
    const loginTime = student.loginTime || "09:30AM";
    const startTime = student.startTime || "10:00AM";
    
    // Fallback QR code data
    const verifyUrl = `https://supportmissionindia.org/verify?reg=${student.registrationId || "N/A"}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

    return (
      <div
        className="w-[297mm] h-[210mm] bg-white relative overflow-hidden box-border text-slate-800 p-[7mm] flex flex-col justify-between font-sans border-[6px] border-double border-[#0c3e8a]"
        style={{
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact"
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&family=Inter:wght@400;600;700;900&display=swap');
          @page {
            size: landscape;
            margin: 0;
          }
          #print-area-wrapper {
            background-color: white !important;
          }
        `}</style>

        {/* Top Header Section */}
        <div className="flex justify-between items-start pb-2 border-b border-slate-300">
          {/* Left: SMI circular logo & Subtitle */}
          <div className="flex flex-col items-center w-[22%] text-center">
            <img src="/smi-logo.png" className="h-16 w-16 object-contain" alt="SMI Logo" />
            <span className="text-[7px] font-bold text-emerald-700 italic mt-1 leading-tight block">Sabka Saath, Sabka Vikas, Sabka Mission.</span>
          </div>

          {/* Center: Main Titles & Partner Logos */}
          <div className="flex flex-col items-center w-[53%] text-center">
            <h1 className="text-xl font-black tracking-tight text-[#0c3e8a] font-serif uppercase leading-none">SUPPORT MISSION INDIA</h1>
            <span className="text-[9px] font-bold text-slate-500 italic mt-0.5">(A National Development Initiative)</span>
            
            {/* Partnership divider */}
            <div className="w-full flex items-center justify-center gap-2 my-1">
              <div className="h-[1px] bg-slate-300 flex-1"></div>
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">IN partnership with</span>
              <div className="h-[1px] bg-slate-300 flex-1"></div>
            </div>

            {/* Partner Logos side by side */}
            <div className="flex items-center gap-6 mt-1">
              <div className="flex flex-col items-center">
                <img 
                  src="https://vidyanjali.education.gov.in/assets/public/logo.png" 
                  className="h-9 object-contain" 
                  alt="Vidyanjali Logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/smi-logo.png";
                  }}
                />
                <span className="text-[6px] font-bold text-slate-500 mt-0.5">(A School Volunteer Programme)</span>
              </div>
              <div className="flex flex-col items-center">
                <img 
                  src="https://pmshrischools.education.gov.in/assets/logo192.png" 
                  className="h-9 object-contain" 
                  alt="PM SHRI Logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/smi-logo.png";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Right: Identifiers Table & QR Code */}
          <div className="w-[25%] flex flex-col items-end gap-1.5 pl-3">
            {/* Identifiers Table */}
            <table className="w-full text-[8.5px] border-collapse border border-slate-300 bg-white">
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-1.5 py-0.5 font-bold text-slate-500 uppercase tracking-wider text-[6.5px]">Admit Card No.</td>
                  <td className="border border-slate-300 px-1.5 py-0.5 font-mono font-bold text-rose-600">{admitCardNo}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1.5 py-0.5 font-bold text-slate-500 uppercase tracking-wider text-[6.5px]">Application ID</td>
                  <td className="border border-slate-300 px-1.5 py-0.5 font-mono font-bold text-slate-700">{appId}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 px-1.5 py-0.5 font-bold text-slate-500 uppercase tracking-wider text-[6.5px]">Roll Number</td>
                  <td className="border border-slate-300 px-1.5 py-0.5 font-mono font-bold text-slate-700">{rollNumber}</td>
                </tr>
              </tbody>
            </table>

            {/* QR code and text */}
            <div className="flex items-center gap-2 border border-slate-200 p-1 rounded bg-white w-full">
              <img src={qrCodeUrl} className="h-11 w-11 object-contain shrink-0" alt="Verification QR" />
              <div className="text-left leading-normal">
                <span className="text-[7.5px] font-black text-[#0c3e8a] block uppercase tracking-wide">Scan QR Code</span>
                <span className="text-[6.5px] text-slate-400 font-semibold block leading-tight">to verify candidate details</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title Banner Section */}
        <div className="flex flex-col items-center my-1 text-center">
          <div className="bg-[#0c3e8a] text-white text-[9px] font-extrabold px-3 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
            AGRAGAMI - 52 WEEK INTEGRATED SKILL DEVELOPMENT PROGRAMME
          </div>
          <h2 className="text-lg font-black text-[#0c3e8a] tracking-tight uppercase mt-0.5">
            INSTRUCTOR ADMIT CARD
          </h2>
          <div className="bg-[#0c3e8a] text-white text-[7.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
            (ONLINE INTERVIEW / ASSESSMENT)
          </div>
        </div>

        {/* Main Content Sections (Candidate Details, Photo, Exam details) */}
        <div className="grid grid-cols-12 gap-3 items-stretch my-1.5 text-left">
          {/* Left Column (Candidate details, photo and login info) (span 9) */}
          <div className="col-span-9 flex flex-col justify-between gap-3 border-r border-slate-250 pr-3">
            
            {/* Top row of Left Column (Candidate Info & Photo) */}
            <div className="grid grid-cols-12 gap-3 items-stretch">
              {/* Candidate Info (Col span 8) */}
              <div className="col-span-8 flex flex-col">
                <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm mb-1.5">
                  CANDIDATE DETAILS
                </div>
                <table className="w-full text-[9.5px] leading-relaxed">
                  <tbody>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5 w-[35%]">Candidate Name</td>
                      <td className="font-extrabold text-[#0c3e8a] py-0.5 w-[65%]">{student.name}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5">Father's / Guardian's Name</td>
                      <td className="font-semibold text-slate-700 py-0.5">{student.fatherName}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5">Date of Birth</td>
                      <td className="font-semibold text-slate-700 py-0.5">{formattedDob}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5">Gender</td>
                      <td className="font-semibold text-slate-700 py-0.5">{student.gender || "FEMALE"}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5">Category</td>
                      <td className="font-semibold text-slate-700 py-0.5">{student.category || "ST"}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5">Mobile Number</td>
                      <td className="font-semibold text-slate-700 py-0.5">{student.phone}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-400 font-bold uppercase tracking-wider text-[7px] py-0.5">Email ID</td>
                      <td className="font-semibold text-slate-700 py-0.5 truncate max-w-[170px]">{student.email}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Photo & Signature (Col span 4) */}
              <div className="col-span-4 flex flex-col items-center justify-between border border-slate-200 p-2 rounded bg-white text-center">
                {/* Photo container */}
                <div className="h-[75px] w-[60px] border border-slate-300 rounded overflow-hidden flex items-center justify-center bg-slate-50 shadow-inner">
                  {student.profilePicUrl ? (
                    <img src={student.profilePicUrl} className="h-full w-full object-cover" alt="Candidate Photo" />
                  ) : (
                    <span className="text-[7px] text-slate-400 text-center font-bold">PASTE PHOTO</span>
                  )}
                </div>
                {/* Signature line */}
                <div className="w-full text-center border-t border-slate-200 mt-2 pt-1">
                  <div style={{ fontFamily: "'Dancing Script', 'Pacifico', 'Brush Script MT', cursive", fontSize: "14px", color: "#1e3a8a" }} className="h-5 flex items-center justify-center font-extrabold select-none italic">
                    {student.name}
                  </div>
                  <div className="h-[1px] bg-slate-400 w-[85%] mx-auto mt-0.5"></div>
                  <span className="text-[7px] font-black uppercase text-slate-400 tracking-wider block mt-0.5">Candidate Signature</span>
                </div>
              </div>
            </div>

            {/* Exam Details (Middle section) */}
            <div className="flex flex-col">
              <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm mb-1.5">
                EXAMINATION / INTERVIEW DETAILS
              </div>
              <table className="w-full text-[9px] leading-relaxed">
                <tbody>
                  <tr className="grid grid-cols-12 w-full gap-x-2">
                    <td className="col-span-4"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Post Applied For</span><span className="font-extrabold text-[#0c3e8a]">{student.course || "Instructor"}</span></td>
                    <td className="col-span-4"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Examination Mode</span><span className="font-semibold text-slate-700">Online (Remote Proctored)</span></td>
                    <td className="col-span-4"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Exam Date</span><span className="font-semibold text-slate-700">{examDate}</span></td>
                  </tr>
                  <tr className="grid grid-cols-12 w-full gap-x-2 mt-1">
                    <td className="col-span-3"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Login Time</span><span className="font-semibold text-slate-700">{loginTime}</span></td>
                    <td className="col-span-3"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Interview Start Time</span><span className="font-semibold text-slate-700">{startTime}</span></td>
                    <td className="col-span-2"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Duration</span><span className="font-semibold text-slate-700">Asper Schedule</span></td>
                    <td className="col-span-4"><span className="text-slate-400 font-bold uppercase tracking-wider text-[7px] block">Platform / Portal</span><span className="font-semibold text-slate-700">Support Mission India Assessment Portal</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Row grid: Login Info, Requirements, Documents */}
            <div className="grid grid-cols-3 gap-3">
              {/* Login Information */}
              <div className="flex flex-col">
                <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm mb-1">
                  LOGIN INFORMATION
                </div>
                <div className="border border-slate-200 p-1.5 rounded bg-slate-50/50 text-[8.5px] space-y-1 flex-1">
                  <p className="font-bold text-slate-600">User ID/ Registration No. : <span className="font-mono font-extrabold text-[#0c3e8a] block">{student.registrationId}</span></p>
                  <p className="font-bold text-slate-500">Password : <span className="text-[#b89047] italic">Will besent onyour registered email& mobile before exam</span></p>
                </div>
              </div>

              {/* Technical Requirements */}
              <div className="flex flex-col">
                <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm mb-1">
                  TECHNICAL REQUIREMENTS
                </div>
                <div className="border border-slate-200 p-1.5 rounded bg-slate-50/50 text-[7.5px] leading-tight space-y-0.5 text-slate-500 font-semibold flex-1">
                  <p>• Laptop/Desktop/Smartphone stable net</p>
                  <p>• Working Webcam (front facing)</p>
                  <p>• Working Microphone & clear audio</p>
                  <p>• Quiet and well-lit environment</p>
                  <p>• Latest Chrome / Firefox / Edge</p>
                  <p>• Do not use any VPN or proxy</p>
                </div>
              </div>

              {/* Documents Required */}
              <div className="flex flex-col">
                <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm mb-1">
                  DOCUMENTS REQUIRED
                </div>
                <div className="border border-slate-200 p-1.5 rounded bg-slate-50/50 text-[7px] leading-tight space-y-0.5 text-slate-500 font-semibold flex-1">
                  <p>• Aadhaar Card / Valid Photo ID (Original)</p>
                  <p>• Admit Card (Soft Copy or Print)</p>
                  <p>• Recent Passport Size Photograph</p>
                  <p className="text-slate-400 mt-0.5 leading-none">Note: Show original ID on camera for verification.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (span 3) - Instructions and Authorised Signatory */}
          <div className="col-span-3 flex flex-col justify-between pl-1">
            <div className="flex flex-col flex-1">
              <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-0.5 uppercase tracking-wide rounded-sm mb-1.5 text-center">
                IMPORTANT INSTRUCTIONS
              </div>
              <div className="text-[7.5px] leading-snug space-y-1.5 text-slate-600 font-medium">
                <p>1. Please login at least 15 minutes before the scheduled time.</p>
                <p>2. Keep your webcam and microphone ON throughout the session.</p>
                <p>3. No other person is allowed in the room during the interview.</p>
                <p>4. Do not use mobile phone, smartwatch, or any other electronic device.</p>
                <p>5. Do not take screenshots, screen recordings or share the interview link.</p>
                <p>6. Ensure stable internet connection. In case of disconnection, re-login immediately.</p>
                <p>7. Any misconduct or use of unfair means will lead to disqualification.</p>
                <p>8. The decision of the panel willbe final and binding.</p>
              </div>
            </div>

            {/* Authorised Signatory Signature stamp */}
            <div className="text-center mt-2 border-t border-slate-200 pt-1.5 flex flex-col items-center">
              <div className="h-6 flex items-center justify-center">
                <span style={{ fontFamily: "'Dancing Script', 'Pacifico', 'Brush Script MT', cursive", fontSize: "16px", color: "#1e3a8a" }} className="font-extrabold">
                  Manish Sinha
                </span>
              </div>
              <div className="h-[1px] bg-slate-400 w-[80%] my-0.5"></div>
              <span className="text-[6.5px] font-extrabold text-slate-500 leading-tight uppercase block">Authorised Signatory</span>
              <span className="text-[6px] font-bold text-slate-400 leading-none block">Programme Coordinator</span>
              <span className="text-[6px] font-bold text-slate-400 leading-none block">Support Mission India</span>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="border-t border-[#0c3e8a] pt-1 flex justify-between items-end text-[7.5px] text-slate-400 font-semibold font-mono shrink-0">
          <div className="text-left">
            <p className="font-extrabold text-slate-600">HELPDESK SUPPORT: +91 9878543210 | info@smi.in.net | www.smi.in.net</p>
          </div>
          
          <div className="text-center flex flex-col items-center">
            <span className="text-[7.5px] font-extrabold text-slate-500 uppercase leading-none block">PROGRAMME IMPLEMENTED BY</span>
            <span className="text-[10px] font-black text-[#0c3e8a] tracking-tight leading-none uppercase mt-0.5 border-b border-[#0c3e8a]">SUPPORT MISSION INDIA</span>
            <span className="text-[6px] text-slate-400 font-bold mt-0.5 block">Empowering India, Enriching Lives</span>
          </div>

          <div className="text-right flex flex-col items-end gap-0.5">
            <span className="text-[7px] font-bold text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded bg-rose-50/50">
              * This Admit Card is valid only for the above mentioned date and time.
            </span>
          </div>
        </div>

        {/* Computer generated disclaimer at the very bottom */}
        <div className="text-[7px] text-slate-400 text-center w-full mt-0.5 leading-none">
          This is a computer generated document and does not require any physical signature.
        </div>

      </div>
    );
  };

  const renderPrintCertificate = (res: any) => {
    if (!res) return null;
    const totalQuestions = res.correctCount + res.incorrectCount;
    const formattedDate = new Date(res.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div
        className="w-[297mm] h-[210mm] bg-white relative overflow-hidden box-border select-none"
        style={{
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact"
        }}
      >
        {/* Background Template Image */}
        <img
          src="/certificate-template.png"
          className="absolute inset-0 w-full h-full object-fill z-0"
          alt="Certificate Template"
        />

        {/* Force Landscape Printing */}
        <style>{`
          @page {
            size: landscape;
            margin: 0;
          }
        `}</style>

        {/* Center Content Mask */}
        <div className="absolute inset-[20mm] bg-white flex flex-col justify-between p-8 z-10 text-center">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center gap-4">
              <img src="/smi-logo.png" className="h-16 w-16 object-contain" alt="SMI Logo" />
              <div className="text-left">
                <h1 className="text-lg font-black tracking-tight text-[#0a1c3a] font-serif">SUPPORT MISSION INDIA</h1>
                <p className="text-[9px] uppercase font-bold text-[#b89047] tracking-widest leading-none">Sarkari Skill Certification Authority</p>
              </div>
            </div>
            <h2 className="text-xl font-extrabold text-[#0a1c3a] tracking-wide uppercase font-serif mt-2">
              CBT Mock Test Completion Certificate
            </h2>
            <div className="w-56 h-0.5 bg-[#b89047] mx-auto my-1" />
          </div>

          {/* Certification Text */}
          <div className="space-y-4 px-12">
            <p className="text-xs italic text-slate-500 font-serif">This is to certify that</p>
            <p className="text-2xl font-black text-[#9b7a2f] tracking-wide font-serif">
              {candidate?.name || "[Candidate Name]"}
            </p>
            <p className="text-[11px] text-slate-700 leading-relaxed max-w-xl mx-auto">
              has successfully participated in and completed the Computer Based Test (CBT) Mock Examination
              on <span className="font-bold text-[#0a1c3a]">{res.quizTitle}</span> conducted on <span className="font-bold text-[#0a1c3a]">{formattedDate}</span>.
            </p>
          </div>

          {/* Grade Display */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#b89047]">Grade Obtained</span>
            <span className="text-3xl font-black text-[#9b7a2f] font-serif tracking-wide mt-1">{res.grade}</span>
          </div>

          {/* Signatures & Verification Info */}
          <div className="flex justify-between items-end px-8 mt-2">
            <div className="text-center w-40 space-y-1">
              <div className="h-8 flex items-center justify-center">
                <span className="font-serif italic text-sm text-[#0a1c3a]/80">Dr. K. Verma</span>
              </div>
              <div className="border-t border-[#b89047]/50 pt-1 text-[8.5px] font-bold text-slate-500 uppercase tracking-wider">
                Authorized Signatory
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="h-10 w-10 rounded-full border-2 border-[#b89047] bg-gradient-to-tr from-[#b89047] to-[#d4af37] flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="white" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </div>
              <span className="text-[7px] font-bold text-[#b89047] uppercase tracking-widest mt-1">VERIFIED</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[8.5px] font-bold text-[#0a1c3a] leading-none">SCAN TO VERIFY</p>
                <p className="text-[6.5px] text-slate-400 font-medium mt-1 leading-normal max-w-[100px]">
                  Verify certificate validity and enrollment details
                </p>
              </div>
              <div className="h-11 w-11 border border-slate-300 p-0.5 bg-white flex items-center justify-center shrink-0">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `https://supportmissionindia.org/verify?reg=${candidate?.registrationId || "N/A"}&id=${res._id}`
                  )}`}
                  className="h-10 w-10 object-contain"
                  alt="QR Code"
                />
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="text-center text-[7.5px] text-slate-400 mt-2 border-t border-slate-100 pt-2 px-12 leading-relaxed">
            This certificate is for practice and self-assessment purposes only and does not constitute an official qualification or guarantee of employment.
          </div>
        </div>
      </div>
    );
  };

  const renderPrintMarksheet = (res: any) => {
    if (!res) return null;
    const totalQuestions = res.correctCount + res.incorrectCount;
    const formattedDate = new Date(res.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const candidateName = candidate?.name || "N/A";
    const regId = candidate?.registrationId || "N/A";
    const courseName = candidate?.course || "N/A";

    return (
      <div className="w-[210mm] h-[297mm] border-[6px] border-slate-900 bg-white p-12 flex flex-col justify-between font-sans relative box-border">
        {/* Force Portrait Printing */}
        <style>{`
          @page {
            size: portrait;
            margin: 0;
          }
        `}</style>
        <div>
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900/20 pb-5 mb-8 flex flex-col items-center gap-2">
            <img src="/smi-logo.png" className="h-16 w-16 object-contain" alt="SMI Logo" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">SUPPORT MISSION INDIA</h1>
              <p className="text-[10px] uppercase font-bold text-deepskyblue-dark tracking-widest mt-1">
                Sarkari Skill Certification Authority
              </p>
              <h2 className="text-sm font-bold text-slate-700 mt-3">EXAM EVALUATION MARKSHEET</h2>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs border-b border-slate-100 pb-5 mb-8">
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Candidate Name</span>
              <span className="font-bold text-slate-800 text-sm">{candidateName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Registration ID</span>
              <span className="font-bold text-slate-800 text-sm">{regId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Enrolled Course</span>
              <span className="font-semibold text-slate-700">{courseName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Examination Date</span>
              <span className="font-semibold text-slate-700">{formattedDate}</span>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Subject Performance Analysis</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-bold">
                  <th className="py-3 px-4 border-b border-slate-200">Assessment Description</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Correct Answers</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Incorrect Answers</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Total Marks</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-right">Obtained Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="text-slate-700">
                  <td className="py-4 px-4 font-bold text-slate-800">{res.quizTitle}</td>
                  <td className="py-4 px-4 text-center font-semibold text-emerald-600">{res.correctCount} / {totalQuestions}</td>
                  <td className="py-4 px-4 text-center font-semibold text-rose-500">{res.incorrectCount} / {totalQuestions}</td>
                  <td className="py-4 px-4 text-center font-semibold">{res.total}</td>
                  <td className="py-4 px-4 text-right font-black text-slate-900">{res.score}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Performance Section */}
          <div className="mt-8 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="text-center">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Obtained Percentage</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{res.percentage}%</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Assigned Grade</span>
              <span className="text-lg font-black text-deepskyblue-dark mt-1 block">{res.grade}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Evaluation Status</span>
              <span className={`text-lg font-black mt-1 block ${res.percentage >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                {res.percentage >= 50 ? "PASS" : "FAIL"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end border-t border-slate-200/80 pt-6">
          <div className="space-y-1 text-[10px] text-slate-500">
            <p>Verification Code: <span className="font-mono text-slate-700 font-bold">{res._id}</span></p>
            <p>Generated by Sarkari Skill Portal on {new Date().toLocaleString()}</p>
          </div>
          <div className="text-center w-36 space-y-1">
            <p className="font-serif italic text-xs text-slate-600 h-6">Dr. K. Verma</p>
            <div className="border-t border-slate-300 pt-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Exam Controller
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrintCumulativeMarksheet = (resList: any[]) => {
    const list = resList && resList.length > 0 ? resList : [];
    const overallTotalScore = list.reduce((acc, curr) => acc + curr.score, 0);
    const overallTotalPossible = list.reduce((acc, curr) => acc + curr.total, 0);
    const averagePercentage = list.length > 0
      ? parseFloat((list.reduce((acc, curr) => acc + curr.percentage, 0) / list.length).toFixed(1))
      : 0;

    let overallGrade = "F";
    if (averagePercentage >= 90) overallGrade = "A+";
    else if (averagePercentage >= 80) overallGrade = "A";
    else if (averagePercentage >= 70) overallGrade = "B+";
    else if (averagePercentage >= 60) overallGrade = "B";
    else if (averagePercentage >= 50) overallGrade = "C";

    const overallStatus = averagePercentage >= 50 ? "PASS" : "FAIL";
    const candidateName = candidate?.name || "N/A";
    const regId = candidate?.registrationId || "N/A";
    const courseName = candidate?.course || "N/A";

    return (
      <div className="w-[210mm] h-[297mm] border-[6px] border-slate-900 bg-white p-12 flex flex-col justify-between font-sans relative box-border">
        {/* Force Portrait Printing */}
        <style>{`
          @page {
            size: portrait;
            margin: 0;
          }
        `}</style>
        <div>
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900/20 pb-5 mb-8 flex flex-col items-center gap-2">
            <img src="/smi-logo.png" className="h-16 w-16 object-contain" alt="SMI Logo" />
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">SUPPORT MISSION INDIA</h1>
              <p className="text-[10px] uppercase font-bold text-deepskyblue-dark tracking-widest mt-1">
                Sarkari Skill Certification Authority
              </p>
              <h2 className="text-sm font-bold text-slate-700 mt-3">SEMESTER CUMULATIVE MARK SHEET</h2>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs border-b border-slate-100 pb-5 mb-8">
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Candidate Name</span>
              <span className="font-bold text-slate-800 text-sm">{candidateName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Registration ID</span>
              <span className="font-bold text-slate-800 text-sm">{regId}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Enrolled Course</span>
              <span className="font-semibold text-slate-700">{courseName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Date Printed</span>
              <span className="font-semibold text-slate-700">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Marks Breakdown Table */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2">Academic Assessment Summary</h3>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[9px] tracking-wider font-bold">
                  <th className="py-3 px-4 border-b border-slate-200">Exam Subject Paper</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Int (30)</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Ext (70)</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Total Score</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-center">Percentage</th>
                  <th className="py-3 px-4 border-b border-slate-200 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">No assessment records found in portal database.</td>
                  </tr>
                ) : (
                  list.map((res, i) => {
                    const internal = Math.round(res.score * (30 / res.total));
                    const external = Math.round((res.total - res.score) * (70 / res.total)) + res.score * 5;
                    return (
                      <tr key={i} className="text-slate-700">
                        <td className="py-3 px-4 font-bold text-slate-800">{res.quizTitle}</td>
                        <td className="py-3 px-4 text-center">{internal > 30 ? 30 : internal}</td>
                        <td className="py-3 px-4 text-center">{external > 70 ? 70 : external}</td>
                        <td className="py-3 px-4 text-center font-bold">{res.score} / {res.total}</td>
                        <td className="py-3 px-4 text-center">{res.percentage}%</td>
                        <td className="py-3 px-4 text-right font-black text-deepskyblue-dark">{res.grade}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Performance Section */}
          <div className="mt-8 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="text-center">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Overall Score</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{overallTotalScore} / {overallTotalPossible}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Average Percentage</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">{averagePercentage}%</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[8px]">Aggregate Grade / Result</span>
              <span className={`text-lg font-black mt-1 block ${overallStatus === "PASS" ? "text-emerald-600" : "text-rose-600"}`}>
                {overallGrade} ({overallStatus})
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end border-t border-slate-200/80 pt-6">
          <div className="space-y-1 text-[10px] text-slate-500">
            <p>Support Mission India Skill Program Registration: <span className="font-mono text-slate-700 font-bold">{regId}</span></p>
            <p>Generated by Sarkari Skill Portal on {new Date().toLocaleString()}</p>
          </div>
          <div className="text-center w-36 space-y-1">
            <p className="font-serif italic text-xs text-slate-600 h-6">Dr. K. Verma</p>
            <div className="border-t border-slate-300 pt-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Exam Controller
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                onClick={() => setActiveTab("lectures")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "lectures" ? "bg-deepskyblue/10 text-deepskyblue-dark border-l-2 border-deepskyblue" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
              >
                <BookMarked className="h-4 w-4" />
                <span>Lectures & Notes</span>
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
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] uppercase font-bold bg-deepskyblue/10 text-deepskyblue-dark border border-deepskyblue/20 px-2 py-0.5 rounded-full">
                    Primary Program
                  </span>
                  {courseData && (
                    <span className={`text-[9px] uppercase font-bold border px-2 py-0.5 rounded-full ${
                      courseData.isPaid 
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    }`}>
                      {courseData.isPaid ? `Paid (₹${courseData.price})` : "Free Course"}
                    </span>
                  )}
                </div>
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

              {/* Enrolled Course Static PDFs & Study Material */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm shadow-slate-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-850">Course PDF Study Materials & Textbooks</h3>
                  <p className="text-[11px] text-slate-450 mt-0.5">Access uploaded books, notes, and static papers assigned to your course program</p>
                </div>

                {papers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No course textbooks or PDF handouts uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Books */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Books & Syllabi</span>
                      {papers.filter(p => p.type === "book").length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No textbooks loaded.</p>
                      ) : (
                        papers.filter(p => p.type === "book").map((pdf, pIdx) => (
                          <a
                            key={pIdx}
                            href={pdf.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-750 transition"
                          >
                            <span className="truncate pr-2">{pdf.title}</span>
                            <span className="text-deepskyblue-dark shrink-0 text-[10px] font-black hover:underline">Open</span>
                          </a>
                        ))
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Lecture Notes</span>
                      {papers.filter(p => p.type === "note").length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No notes loaded.</p>
                      ) : (
                        papers.filter(p => p.type === "note").map((pdf, pIdx) => (
                          <a
                            key={pIdx}
                            href={pdf.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-750 transition"
                          >
                            <span className="truncate pr-2">{pdf.title}</span>
                            <span className="text-deepskyblue-dark shrink-0 text-[10px] font-black hover:underline">Open</span>
                          </a>
                        ))
                      )}
                    </div>

                    {/* Question Papers */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-1.5">Exam Sheets</span>
                      {papers.filter(p => !p.type || p.type === "exam_paper").length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic">No static papers loaded.</p>
                      ) : (
                        papers.filter(p => !p.type || p.type === "exam_paper").map((pdf, pIdx) => (
                          <a
                            key={pIdx}
                            href={pdf.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-750 transition"
                          >
                            <span className="truncate pr-2">{pdf.title}</span>
                            <span className="text-deepskyblue-dark shrink-0 text-[10px] font-black hover:underline">Open</span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                )}
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
                    Interactive Online Exams
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Complete online evaluations to update your semester mark sheet</p>
                </div>

                {quizzes.length === 0 ? (
                  <p className="text-xs text-slate-550 p-4 rounded-xl bg-white border border-slate-200/80 text-center font-medium shadow-sm shadow-slate-100">
                    No active online exams created for your course syllabus yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {quizzes.map((quiz, i) => {
                      const result = results.find(r => r.quizId === quiz._id);
                      const isNotStarted = quiz.scheduledAt && new Date(quiz.scheduledAt) > new Date();
                      return (
                        <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm shadow-slate-100">
                          <div className="flex items-start gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              result 
                                ? "bg-emerald-50 border-emerald-150 text-emerald-600" 
                                : isNotStarted 
                                  ? "bg-slate-50 border-slate-150 text-slate-400"
                                  : "bg-deepskyblue/10 border-deepskyblue/20 text-deepskyblue animate-pulse"
                            }`}>
                              <Award className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{quiz.title}</h4>
                              <p className="text-xs text-slate-400 mt-0.5 font-semibold flex flex-wrap gap-x-2 gap-y-1">
                                <span>{quiz.questions?.length || 0} Objective Questions</span>
                                {quiz.duration && <span>| Duration: {quiz.duration} Mins</span>}
                                {quiz.scheduledAt && (
                                  <span className={isNotStarted ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                                    | Scheduled: {new Date(quiz.scheduledAt).toLocaleString()}
                                  </span>
                                )}
                              </p>
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
                            ) : isNotStarted ? (
                              <button
                                disabled
                                className="py-1.5 px-4 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-450 cursor-not-allowed shadow-none"
                              >
                                Not Started
                              </button>
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
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerPrint("cumulative_marksheet", results)}
                    className="flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Mark Sheet</span>
                  </button>
                  {results.length > 0 && (
                    <button
                      onClick={() => triggerPrint("certificate", results[results.length - 1])}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-bold text-white shadow shadow-amber-500/10 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Award className="h-3.5 w-3.5 text-white" />
                      <span>Print Certificate</span>
                    </button>
                  )}
                </div>
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
                        <th className="py-2.5 text-center print:text-right">Grade</th>
                        <th className="py-2.5 text-right print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-zinc-200">
                      {resultsToDisplay.map((res: any, i) => (
                        <tr key={i} className="text-slate-700 print:text-black">
                          <td className="py-3 font-semibold text-slate-500 print:text-zinc-600">{res.code}</td>
                          <td className="py-3 font-medium text-slate-800">{res.subject}</td>
                          <td className="py-3 text-center">{res.internal}</td>
                          <td className="py-3 text-center">{res.external}</td>
                          <td className="py-3 text-center font-bold text-slate-900 print:text-black">{res.total}</td>
                          <td className="py-3 text-center print:text-right font-black text-deepskyblue-dark print:text-zinc-800">{res.grade}</td>
                          <td className="py-3 text-right print:hidden">
                            <div className="flex gap-2 justify-end">
                              {res.originalData && (
                                <>
                                  <button
                                    onClick={() => triggerPrint("marksheet", res.originalData)}
                                    className="py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-600 transition cursor-pointer"
                                  >
                                    Marksheet
                                  </button>
                                  <button
                                    onClick={() => triggerPrint("certificate", res.originalData)}
                                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-[10px] font-bold text-white shadow shadow-amber-500/10 transition cursor-pointer"
                                  >
                                    Certificate
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
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

          {/* TAB CONTENT: LECTURES & NOTES */}
          {activeTab === "lectures" && (
            <div className="space-y-6 max-w-4xl animate-fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-deepskyblue" />
                  Course Lectures & Study Materials
                </h2>
                <p className="text-xs text-slate-500 mt-1">Access lecture class notes, reference books, and handbooks for {candidate.course}</p>
              </div>

              {/* SECTION A: STUDY BOOKS & SYLLABUS TEXT */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-deepskyblue" />
                    Study Books & Syllabus Text
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Reference books and reading materials assigned by the admin</p>
                </div>

                {papers.filter(p => p.type === "book").length === 0 ? (
                  <p className="text-xs text-slate-550 p-4 rounded-xl bg-white border border-slate-200/80 text-center font-medium shadow-sm shadow-slate-100">
                    No study books uploaded for your course yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {papers.filter(p => p.type === "book").map((paper, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-slate-205 flex items-center justify-between gap-4 shadow-sm shadow-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-sky-50 border border-sky-100 text-sky-600">
                            <BookOpen className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{paper.title}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">Text Material</span>
                          </div>
                        </div>
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-3.5 rounded-lg bg-deepskyblue/10 text-xs font-bold hover:bg-deepskyblue hover:text-white text-deepskyblue-dark cursor-pointer transition-colors"
                        >
                          Open Book
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION B: LECTURE & CLASS NOTES */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-deepskyblue" />
                    Lecture & Class Notes
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Classroom handouts and slides compiled by your instructor</p>
                </div>

                {papers.filter(p => p.type === "note").length === 0 ? (
                  <p className="text-xs text-slate-555 p-4 rounded-xl bg-white border border-slate-200/80 text-center font-medium shadow-sm shadow-slate-100">
                    No class notes uploaded for your course yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {papers.filter(p => p.type === "note").map((paper, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-slate-205 flex items-center justify-between gap-4 shadow-sm shadow-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-emerald-50 border border-emerald-100 text-emerald-600">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{paper.title}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">Lecture Note</span>
                          </div>
                        </div>
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-3.5 rounded-lg bg-deepskyblue/10 text-xs font-bold hover:bg-deepskyblue hover:text-white text-deepskyblue-dark cursor-pointer transition-colors"
                        >
                          View Note
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION C: SYLLABUS QUESTION PAPERS */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-deepskyblue" />
                    Syllabus Question Papers
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Static practice question papers and materials</p>
                </div>

                {papers.filter(p => !p.type || p.type === "exam_paper").length === 0 ? (
                  <p className="text-xs text-slate-555 p-4 rounded-xl bg-white border border-slate-200/80 text-center font-medium shadow-sm shadow-slate-100">
                    No syllabus question papers uploaded for your course yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {papers.filter(p => !p.type || p.type === "exam_paper").map((paper, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white border border-slate-205 flex items-center justify-between gap-4 shadow-sm shadow-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-purple-50 border border-purple-100 text-purple-600">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{paper.title}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold">Practice Paper</span>
                          </div>
                        </div>
                        <a
                          href={paper.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1.5 px-3.5 rounded-lg bg-deepskyblue/10 text-xs font-bold hover:bg-deepskyblue hover:text-white text-deepskyblue-dark cursor-pointer transition-colors"
                        >
                          View Paper
                        </a>
                      </div>
                    ))}
                  </div>
                )}
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
                    <div className="flex flex-wrap gap-2 items-center mt-3 justify-center sm:justify-start">
                      <span className="inline-block text-[10px] uppercase font-bold bg-deepskyblue/10 text-deepskyblue-dark border border-deepskyblue/20 px-2 py-0.5 rounded-full">
                        Admission Active
                      </span>
                      <button
                        onClick={() => triggerPrint("admitcard", candidate)}
                        className="inline-flex items-center gap-1.5 py-1 px-3 bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 text-[10px] font-bold text-white rounded-xl shadow-md cursor-pointer transition active:scale-95"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Admit Card</span>
                      </button>
                    </div>
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

      {/* EXAM KEY / PASSWORD ENTRY MODAL */}
      {pendingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-deepskyblue/10 flex items-center justify-center text-deepskyblue-dark mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Exam Entry Locker</h3>
              <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                Please enter the authorized passkey to enter the exam room for <span className="text-slate-700 font-bold">{pendingQuiz.title}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Password / Key</label>
                <input
                  type="password"
                  required
                  placeholder="Enter exam password"
                  value={enteredPassword}
                  onChange={e => setEnteredPassword(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all font-mono"
                />
              </div>

              {passwordError && (
                <p className="text-[10px] text-rose-600 font-bold leading-normal flex items-start gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingQuiz(null)}
                  className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-deepskyblue hover:bg-deepskyblue-dark text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                >
                  Unlock Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE EXAM MODAL */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-250 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-left">
            <div className="flex justify-between items-start border-b border-slate-150 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">{activeQuiz.title}</h3>
                <div className="flex flex-wrap items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-455 font-semibold">Course Cohort: {activeQuiz.course}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-1 text-xs font-extrabold text-deepskyblue-dark">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Time Remaining: {formatTime(timeRemaining)}</span>
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to exit the exam? Your progress will not be saved.")) {
                    setActiveQuiz(null);
                  }
                }}
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
      <footer className="h-18 border-t border-slate-200/80 backdrop-blur-lg bg-white/90 fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-1 lg:hidden print:hidden shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)] transition-all">
        {/* Courses */}
        <button
          onClick={() => setActiveTab("courses")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-300 relative cursor-pointer group"
        >
          <div className={`transition-all duration-300 p-1 rounded-xl ${
            activeTab === "courses" ? "bg-deepskyblue/10 text-deepskyblue-dark scale-110 -translate-y-1" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[8.5px] tracking-wider transition-all duration-300 font-bold ${
            activeTab === "courses" ? "text-deepskyblue-dark font-black scale-105" : "text-slate-400"
          }`}>
            Courses
          </span>
          {activeTab === "courses" && (
            <span className="absolute bottom-0 h-1 w-6 bg-deepskyblue rounded-t-full shadow-[0_-2px_6px_#00bfff]" />
          )}
        </button>

        {/* Papers */}
        <button
          onClick={() => setActiveTab("papers")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-300 relative cursor-pointer group"
        >
          <div className={`transition-all duration-300 p-1 rounded-xl ${
            activeTab === "papers" ? "bg-deepskyblue/10 text-deepskyblue-dark scale-110 -translate-y-1" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            <FileText className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[8.5px] tracking-wider transition-all duration-300 font-bold ${
            activeTab === "papers" ? "text-deepskyblue-dark font-black scale-105" : "text-slate-400"
          }`}>
            Papers
          </span>
          {activeTab === "papers" && (
            <span className="absolute bottom-0 h-1 w-6 bg-deepskyblue rounded-t-full shadow-[0_-2px_6px_#00bfff]" />
          )}
        </button>

        {/* Results */}
        <button
          onClick={() => setActiveTab("results")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-300 relative cursor-pointer group"
        >
          <div className={`transition-all duration-300 p-1 rounded-xl ${
            activeTab === "results" ? "bg-deepskyblue/10 text-deepskyblue-dark scale-110 -translate-y-1" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            <Award className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[8.5px] tracking-wider transition-all duration-300 font-bold ${
            activeTab === "results" ? "text-deepskyblue-dark font-black scale-105" : "text-slate-400"
          }`}>
            Results
          </span>
          {activeTab === "results" && (
            <span className="absolute bottom-0 h-1 w-6 bg-deepskyblue rounded-t-full shadow-[0_-2px_6px_#00bfff]" />
          )}
        </button>

        {/* Lectures */}
        <button
          onClick={() => setActiveTab("lectures")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-300 relative cursor-pointer group"
        >
          <div className={`transition-all duration-300 p-1 rounded-xl ${
            activeTab === "lectures" ? "bg-deepskyblue/10 text-deepskyblue-dark scale-110 -translate-y-1" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            <BookMarked className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[8.5px] tracking-wider transition-all duration-300 font-bold ${
            activeTab === "lectures" ? "text-deepskyblue-dark font-black scale-105" : "text-slate-400"
          }`}>
            Lectures
          </span>
          {activeTab === "lectures" && (
            <span className="absolute bottom-0 h-1 w-6 bg-deepskyblue rounded-t-full shadow-[0_-2px_6px_#00bfff]" />
          )}
        </button>

        {/* Attendance */}
        <button
          onClick={() => setActiveTab("attendance")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-300 relative cursor-pointer group"
        >
          <div className={`transition-all duration-300 p-1 rounded-xl ${
            activeTab === "attendance" ? "bg-deepskyblue/10 text-deepskyblue-dark scale-110 -translate-y-1" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[8.5px] tracking-wider transition-all duration-300 font-bold ${
            activeTab === "attendance" ? "text-deepskyblue-dark font-black scale-105" : "text-slate-400"
          }`}>
            Attend
          </span>
          {activeTab === "attendance" && (
            <span className="absolute bottom-0 h-1 w-6 bg-deepskyblue rounded-t-full shadow-[0_-2px_6px_#00bfff]" />
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => setActiveTab("profile")}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all duration-300 relative cursor-pointer group"
        >
          <div className={`transition-all duration-300 p-1 rounded-xl ${
            activeTab === "profile" ? "bg-deepskyblue/10 text-deepskyblue-dark scale-110 -translate-y-1" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            <User className="h-4.5 w-4.5" />
          </div>
          <span className={`text-[8.5px] tracking-wider transition-all duration-300 font-bold ${
            activeTab === "profile" ? "text-deepskyblue-dark font-black scale-105" : "text-slate-400"
          }`}>
            Profile
          </span>
          {activeTab === "profile" && (
            <span className="absolute bottom-0 h-1 w-6 bg-deepskyblue rounded-t-full shadow-[0_-2px_6px_#00bfff]" />
          )}
        </button>
      </footer>

      {/* PRINT AREA CONTAINER (Hidden on screen, shown in printing) */}
      <div id="print-area-wrapper" className="hidden print:block">
        {printTarget?.type === "marksheet" && renderPrintMarksheet(printTarget.data)}
        {printTarget?.type === "cumulative_marksheet" && renderPrintCumulativeMarksheet(printTarget.data)}
        {printTarget?.type === "certificate" && renderPrintCertificate(printTarget.data)}
        {printTarget?.type === "admitcard" && renderPrintAdmitCard(printTarget.data)}
      </div>

    </div>
  );
}
