"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
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
  BookMarked,
  ExternalLink,
  Shield
} from "lucide-react";
import { resolveFileUrl } from "@/lib/fileUrl";
import { formatExamSchedule, isExamNotStarted, isExamWindowClosed, formatExamWindowEnd } from "@/lib/examSchedule";
import Logo from "@/components/Logo";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
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
  const [liveClasses, setLiveClasses] = useState<any[]>([]);

  // Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [submittingQuiz, setSubmittingQuiz] = useState<boolean>(false);

  // Print Target State
  const [printTarget, setPrintTarget] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);

  // Exam Review States
  const [reviewResult, setReviewResult] = useState<any>(null);
  const [reviewQuiz, setReviewQuiz] = useState<any>(null);
  const [loadingReview, setLoadingReview] = useState<boolean>(false);

  // Exam Locker and Countdown States
  const [pendingQuiz, setPendingQuiz] = useState<any>(null);
  const [enteredPassword, setEnteredPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);

  const activeQuizRef = React.useRef(activeQuiz);
  const selectedAnswersRef = React.useRef(selectedAnswers);
  const examExpiresAtRef = React.useRef<string | null>(null);
  const saveProgressTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeQuizRef.current = activeQuiz;
  }, [activeQuiz]);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  useEffect(() => {
    if (!activeQuiz || !examExpiresAtRef.current) return;

    const updateRemaining = () => {
      const expiresAt = examExpiresAtRef.current;
      if (!expiresAt) return 0;

      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeRemaining(remaining);
      return remaining;
    };

    updateRemaining();

    const interval = setInterval(() => {
      const remaining = updateRemaining();
      if (remaining <= 0) {
        clearInterval(interval);
        if (activeQuizRef.current) {
          submitQuizAnswers(selectedAnswersRef.current, true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const saveExamProgress = async (answersToSave: number[], quizId: string) => {
    try {
      setSavingProgress(true);
      const res = await fetch(`/api/exam-sessions/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersToSave }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.expiresAt) {
        examExpiresAtRef.current = data.expiresAt;
      }
    } catch (err) {
      console.error("Failed to save exam progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const scheduleSaveExamProgress = (answersToSave: number[], quizId: string) => {
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }

    saveProgressTimeoutRef.current = setTimeout(() => {
      saveExamProgress(answersToSave, quizId);
    }, 700);
  };

  const startQuizWithQuestions = async (quizId: string) => {
    try {
      const res = await fetch(`/api/exam-sessions/${quizId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const fullQuiz = data.quiz;
        setActiveQuiz(fullQuiz);
        setSelectedAnswers(data.session.answers);
        examExpiresAtRef.current = data.expiresAt;
        setTimeRemaining(data.remainingSeconds);
        setPendingQuiz(null);
        setEnteredPassword("");
        setPasswordError("");

        if (data.resumed && data.session.answeredCount > 0) {
          toast.success(
            `Resuming exam. ${data.session.answeredCount} of ${data.session.totalQuestions} questions already answered.`
          );
        }
      } else {
        toast.error(data.error || "Failed to load exam. Make sure the exam window is open.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error starting exam.");
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

      // 6. Fetch Live Classes
      try {
        const resLive = await fetch("/api/live-classes");
        const dataLive = await resLive.json();
        if (resLive.ok && dataLive.success) {
          setLiveClasses(dataLive.classes || []);
        }
      } catch (err) {
        console.error("Fetch Live Classes Error:", err);
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

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      // 1. Fetch public Key ID from /api/payment/key
      const keyRes = await fetch("/api/payment/key");
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.success || !keyData.keyId) {
        toast.error(keyData.error || "Failed to retrieve payment configuration keys.");
        setPaymentLoading(false);
        return;
      }

      // 2. Create payment order via /api/payment/create-order
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST"
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success || !orderData.order) {
        toast.error(orderData.error || "Failed to initialize enrollment payment order.");
        setPaymentLoading(false);
        return;
      }

      const { id: order_id, amount, currency } = orderData.order;

      // 3. Load checkout.js script
      const scriptLoaded = await new Promise((resolve) => {
        if ((window as any).Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay SDK. Please check your internet connection.");
        setPaymentLoading(false);
        return;
      }

      // 4. Initialize Razorpay Checkout options
      const options = {
        key: keyData.keyId,
        amount: amount,
        currency: currency,
        name: "Support Mission India",
        description: `Enrollment Fee - ${candidate.course}`,
        image: "/smi-logo.png",
        order_id: order_id,
        handler: async function (response: any) {
          setPaymentLoading(true);
          try {
            // Verify payment on backend
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment successful! Your course has been unlocked.");
              // Update local state dynamically to immediately unlock the UI
              setCandidate((prev: any) => ({ ...prev, isPaid: true }));
            } else {
              toast.error(verifyData.error || "Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Payment verification network error:", err);
            toast.error("Network error verifying payment.");
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: candidate.name,
          email: candidate.email,
          contact: candidate.phone
        },
        theme: {
          color: "#0ea5e9"
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();

    } catch (err) {
      console.error("Initiating payment error:", err);
      toast.error("An unexpected error occurred while initiating payment.");
      setPaymentLoading(false);
    }
  };

  const handleReviewAnswers = async (resultRecord: any) => {
    setReviewResult(resultRecord);
    setLoadingReview(true);
    try {
      const res = await fetch(`/api/quizzes/${resultRecord.quizId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewQuiz(data.quiz);
      } else {
        toast.error(data.error || "Failed to load quiz details for review.");
        setReviewResult(null);
      }
    } catch (err) {
      console.error("Error fetching review quiz:", err);
      toast.error("Network error fetching quiz details.");
      setReviewResult(null);
    } finally {
      setLoadingReview(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const triggerPrint = (type: "marksheet" | "certificate" | "cumulative_marksheet" | "admitcard" | "idcard", data: any) => {
    setPrintTarget({ type, data });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Start Exam Quiz Handler
  const handleStartQuiz = async (quiz: any) => {
    if (isExamNotStarted(quiz.scheduledAt)) {
      toast.error(
        `This exam has not started yet. It is scheduled for ${formatExamSchedule(quiz.scheduledAt)}.`
      );
      return;
    }

    if (isExamWindowClosed(quiz.scheduledAt, quiz.duration || 30)) {
      toast.error(
        `Exam window has ended. It was open until ${formatExamWindowEnd(quiz.scheduledAt, quiz.duration || 30)}.`
      );
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

    if (activeQuiz?._id) {
      scheduleSaveExamProgress(updated, activeQuiz._id);
    }
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
          toast.success("Time expired! Your exam was automatically submitted. Your results are pending administrator review.");
        } else {
          toast.success("Exam submitted successfully! Your results are pending administrator review.");
        }
        examExpiresAtRef.current = null;
        setActiveQuiz(null);
        await fetchDashboardData();
      } else {
        toast.error(data.error || "Failed to submit answers.");
      }
    } catch (err) {
      console.error("Exam submission error:", err);
      toast.error("Network error submitting answers.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnswers.includes(-1)) {
      toast.error("Please answer all questions before submitting.");
      return;
    }
    await submitQuizAnswers(selectedAnswers, false);
  };

  // Dynamic Results mapping into print Mark Sheet
  const resultsToDisplay = results.map((r, i) => {
    const code = `QUIZ-${101 + i}`;
    const isApproved = !!r.isApproved;
    
    // If approved, map scores. If not, fallback to placeholders.
    const internal = isApproved ? Math.round((r.score || 0) * (30 / (r.total || 1))) : null;
    const external = isApproved ? Math.round(((r.total || 0) - (r.score || 0)) * (70 / (r.total || 1))) + (r.score || 0) * 5 : null;
    const total = isApproved ? Math.round(((r.score || 0) / (r.total || 1)) * 100) : null;
    
    return {
      code,
      subject: r.quizTitle,
      internal: isApproved ? (internal! > 30 ? 30 : internal) : "-",
      external: isApproved ? (external! > 70 ? 70 : external) : "-",
      total: isApproved ? total : "Pending",
      grade: isApproved ? r.grade : "Pending",
      isApproved,
      isCertificateApproved: !!r.isCertificateApproved,
      originalData: r
    };
  });

  // Derive GPA only from APPROVED results
  const approvedResults = results.filter(r => r.isApproved);
  const totalPercentage = approvedResults.length > 0
    ? approvedResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / approvedResults.length
    : 0;
  const weightedGpa = approvedResults.length > 0 ? (totalPercentage / 10).toFixed(2) : "0.00";
  const finalStatus = approvedResults.length > 0 && totalPercentage >= 50 ? "PASS" : "PENDING";

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
  const profilePhotoUrl = resolveFileUrl(candidate.profilePicUrl);

  const renderProfileAvatar = (
    className: string,
    textClassName = "text-xs font-bold text-white"
  ) =>
    profilePhotoUrl ? (
      <img
        src={profilePhotoUrl}
        className={`${className} object-cover`}
        alt={`${candidate.name} profile`}
      />
    ) : (
      <div
        className={`${className} bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center ${textClassName} shadow-inner`}
      >
        {avatarInitials}
      </div>
    );

  const isDashboardLocked = courseData?.isPaid && !candidate?.isPaid;


  const renderPrintIdCard = (student: any) => {
    if (!student) return null;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("https://app.smi.in.net/login")}`;

    const formatDate = (dateInput: any) => {
      if (!dateInput) return "01.01.2025";
      const d = new Date(dateInput);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    };

    const joinedDate = formatDate(student.createdAt);
    const expireDate = formatDate(
      student.createdAt 
        ? new Date(new Date(student.createdAt).setFullYear(new Date(student.createdAt).getFullYear() + 1))
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    );

    return (
      <div 
        className="w-[210mm] h-[297mm] bg-white hidden print:flex flex-row items-start justify-center gap-10 pt-24 absolute inset-0 z-50 font-sans"
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Inter:wght@400;500;600;700;800;900&display=swap');
          .font-sans {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .font-signature {
            font-family: 'Dancing Script', cursive;
          }
        `}</style>

        {/* FRONT CARD */}
        <div className="w-[64mm] h-[100mm] border border-slate-300 rounded-2xl shadow-xl bg-white overflow-hidden relative flex flex-col scale-110 transform origin-top-left">
          {/* Header SVG Wave Background */}
          <div className="absolute top-0 left-0 w-full h-[32%] z-0">
            <svg viewBox="0 0 200 80" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,0 L200,0 L200,55 C160,75 140,45 100,55 C60,65 40,75 0,55 Z" fill="#00BFFF" />
              <path d="M0,55 C40,75 60,65 100,55 C140,45 160,75 200,55 L200,58 C160,78 140,48 100,58 C60,68 40,78 0,58 Z" fill="#0C2340" opacity="0.4" />
              <path d="M0,55 C40,75 60,65 100,55 C140,45 160,75 200,55" fill="none" stroke="#0C2340" strokeWidth="1" />
            </svg>
          </div>

          {/* Company Logo and Tagline */}
          <div className="flex flex-col items-center justify-center pt-3 pb-1 z-10 relative">
            <img src="/smi-logo-clean.png" alt="SMI Logo" className="h-6 object-contain drop-shadow-sm" />
            <span className="text-[5.5px] font-black uppercase tracking-wider text-[#0C2340] mt-0.5">Support Mission India</span>
          </div>

          {/* Photo overlapping header */}
          <div className="flex-shrink-0 flex justify-center mt-3 z-10 relative">
            <div className="relative p-0.5 bg-white rounded-full shadow-md border border-slate-200">
              <div className="absolute inset-[-3px] rounded-full border border-[#00BFFF] opacity-80 scale-100"></div>
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                {student.profilePicUrl ? (
                  <img src={resolveFileUrl(student.profilePicUrl)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-slate-300" />
                )}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 pt-4 pb-12 flex-1 flex flex-col items-center z-10 relative">
            <h3 className="text-[11px] font-black text-[#00BFFF] uppercase tracking-tight text-center">{student.name}</h3>
            <p className="text-[7.5px] text-[#0C2340] font-black tracking-wider uppercase mt-0.5 text-center">{student.course}</p>
            
            <div className="w-full mt-3 space-y-1 text-[7px] font-semibold text-slate-700 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-400 font-bold uppercase text-[5.5px]">ID No</span>
                <span className="text-[#00BFFF] font-bold">{student.registrationId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-400 font-bold uppercase text-[5.5px]">Father's Name</span>
                <span className="text-slate-800 font-bold truncate max-w-[28mm] text-right">{student.fatherName || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-400 font-bold uppercase text-[5.5px]">DOB</span>
                <span className="text-slate-800 font-bold">{new Date(student.dob).toLocaleDateString("en-GB")}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-0.5">
                <span className="text-slate-400 font-bold uppercase text-[5.5px]">Mobile</span>
                <span className="text-slate-800 font-bold">{student.phone || student.mobile || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Footer Wave & Website */}
          <div className="absolute bottom-0 left-0 w-full h-[10%] z-10">
            <svg viewBox="0 0 200 40" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,20 C40,5 60,15 100,5 C140,-5 160,10 200,0 L200,40 L0,40 Z" fill="#00BFFF" />
            </svg>
            <div className="absolute bottom-1 w-full text-center text-white text-[6.5px] font-black tracking-widest">
              app.smi.in.net
            </div>
          </div>
        </div>

        {/* BACK CARD */}
        <div className="w-[64mm] h-[100mm] border border-slate-300 rounded-2xl shadow-xl bg-white overflow-hidden relative flex flex-col scale-110 transform origin-top-left">
          {/* Header Curved Double Lines */}
          <div className="absolute top-0 left-0 w-full h-[15%] z-0">
            <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
              <path d="M0,0 Q100,45 200,0" fill="none" stroke="#00BFFF" strokeWidth="2.5" />
              <path d="M0,0 Q100,35 200,0" fill="none" stroke="#00BFFF" strokeWidth="1" opacity="0.6" />
            </svg>
          </div>

          {/* Spacer to push content down */}
          <div className="h-[12%]"></div>

          {/* Terms & Conditions */}
          <div className="px-4 py-2 flex flex-col items-center">
            <h4 className="text-[7.5px] font-bold text-[#00BFFF] tracking-wide uppercase border-b border-[#00BFFF] pb-0.5 w-full text-center">Terms and Conditions</h4>
            <ul className="text-[5.5px] text-slate-500 font-semibold space-y-1 mt-2 text-left w-full list-disc pl-3">
              <li>This Identity Card is non-transferable and remains the property of Support Mission India.</li>
              <li>It must be presented during examinations, practical classes, and official visits.</li>
              <li>Scan the QR code below using any smartphone to verify the dynamic digital profile.</li>
              <li>If found, please return to nearest SMI campus or mail to administrative head office.</li>
            </ul>
          </div>

          {/* Dates Section */}
          <div className="px-4 mt-1 flex justify-around text-center w-full">
            <div>
              <span className="text-[5px] text-slate-400 font-bold uppercase block">Joined</span>
              <span className="text-[7.5px] text-slate-800 font-black">{joinedDate}</span>
            </div>
            <div className="w-[0.5px] h-6 bg-slate-200"></div>
            <div>
              <span className="text-[5px] text-slate-400 font-bold uppercase block">Expire</span>
              <span className="text-[7.5px] text-[#00BFFF] font-black">{expireDate}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="px-4 mt-2">
            <div className="w-full h-[0.5px] bg-[#00BFFF]/20"></div>
          </div>

          {/* Contact Details */}
          <div className="px-4 mt-2 text-center">
            <span className="text-[5px] text-slate-400 font-bold uppercase block">Contact Company</span>
            <span className="text-[6.5px] text-slate-700 font-bold block mt-0.5">info@smi.in.net</span>
            <span className="text-[6.5px] text-[#0C2340] font-bold block">www.smi.in.net</span>
          </div>

          {/* Footer Area with QR Code and Signature */}
          <div className="flex-1 flex items-end justify-between px-4 pb-4 mt-2 z-10 relative">
            {/* QR Code and verify text */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white p-0.5 border border-slate-200 rounded-lg shadow-sm flex items-center justify-center">
                <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
              </div>
              <span className="text-[4.5px] text-slate-400 font-bold mt-1 uppercase">Scan to Verify</span>
            </div>

            {/* Signature */}
            <div className="flex flex-col items-center justify-end h-16">
              <div className="h-10 w-20 relative flex items-center justify-center -rotate-2 select-none pr-1">
                <img src="/authorized-signature.jpg" alt="Authorized Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
              </div>
              <div className="w-20 h-[0.5px] bg-slate-300 my-1"></div>
              <span className="text-[5px] text-slate-400 font-bold uppercase tracking-wider">Authorized Signatory</span>
            </div>
          </div>

          {/* Bottom Right Corner Navy Curve */}
          <div className="absolute bottom-0 right-0 w-20 h-20 z-0">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <path d="M100,0 Q50,50 100,100 Z" fill="#00BFFF" />
              <path d="M100,10 Q60,60 100,100" fill="none" stroke="#0C2340" strokeWidth="1.5" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const renderPrintAdmitCard = (student: any) => {
    if (!student) return null;
    
    // Extract ID details dynamically
    const appId = student.registrationId || "";
    const admitCardNo = appId;
    
    const formattedDob = student.dob 
      ? new Date(student.dob).toLocaleDateString("en-GB").replace(/\//g, " / ") 
      : "14 / 09 / 2003";
      
    // Find current quiz assigned to the student for their course
    const currentQuiz = quizzes.find((q: any) => {
      const isAssigned = q.assignedStudents?.some((s: any) => {
        const idStr = typeof s === "object" ? s._id?.toString() : s?.toString();
        return idStr === student._id?.toString();
      });
      return q.course === student.course && isAssigned;
    }) || quizzes.find((q: any) => q.course === student.course) || quizzes[0] || null;

    let examName = "Mock CBT Examination";
    let examType = "Computer Based Test (Mock Assessment)";
    let formattedExamDate = "To Be Announced";
    let formattedLoginTime = "To Be Announced";
    let formattedGateClosingTime = "To Be Announced";
    let formattedStartTime = "To Be Announced";

    if (currentQuiz) {
      examName = currentQuiz.title;
      examType = "Computer Based Test";
      if (currentQuiz.scheduledAt) {
        const scheduledDate = new Date(currentQuiz.scheduledAt);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = days[scheduledDate.getDay()];
        const dateStr = scheduledDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        formattedExamDate = `${dateStr} (${dayName})`;
        
        formattedStartTime = scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        
        const reportingDate = new Date(scheduledDate.getTime() - 30 * 60 * 1000);
        formattedLoginTime = reportingDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
        
        const gateClosingDate = new Date(scheduledDate.getTime() - 15 * 60 * 1000);
        formattedGateClosingTime = gateClosingDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      }
    } else {
      examName = `${student.course} Exam`;
      examType = "Computer Based Test";
      if (student.examDate) {
        const scheduledDate = new Date(student.examDate);
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayName = days[scheduledDate.getDay()];
        const dateStr = scheduledDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        formattedExamDate = `${dateStr} (${dayName})`;
      }
      formattedStartTime = student.startTime || "To Be Announced";
      formattedLoginTime = student.loginTime || "To Be Announced";
      formattedGateClosingTime = "15 Mins Before Exam";
    }
    
    // Fallback QR code data
    const verifyUrl = `https://smi.in.net/verify?reg=${student.registrationId || "N/A"}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;

    return (
      <div
        className="w-[297mm] h-[210mm] bg-white relative overflow-hidden box-border text-slate-800 p-[6mm] flex flex-col justify-between font-sans border-[3px] border-[#0c3e8a] rounded-lg"
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
        <div className="relative flex justify-between items-center border-b border-slate-300 pb-2 mb-1">
          {/* Left & Center Header */}
          <div className="flex-1 flex flex-col items-center relative">
            {/* Horizontal line behind the ADMIT CARD title */}
            <div className="absolute top-[20px] left-0 right-0 h-[2px] bg-[#0c3e8a] z-0"></div>
            
            {/* ADMIT CARD Title Badge */}
            <div className="relative z-10 bg-[#0c3e8a] text-white text-2xl font-black px-12 py-1 rounded-full uppercase tracking-wider shadow-md">
              ADMIT CARD
            </div>
            
            <div className="text-xs font-black text-slate-800 mt-2 z-10 bg-white px-4">
              Issued By: <span className="text-[#0c3e8a]">SUPPORT MISSION INDIA</span>
            </div>
          </div>
          
          {/* Right Header Logo */}
          <div className="flex flex-col items-center text-center shrink-0 pl-4 w-[180px]">
            <img src="/smi-logo.png" className="h-14 w-auto object-contain" alt="SMI Logo" />
            <span className="text-[7px] font-black text-emerald-700 italic mt-0.5 leading-tight block">
              Sabka Saath, Sabka Vikas, Sabka Mission.
            </span>
          </div>
        </div>

        {/* Main Content Sections (Candidate Details, Photo, Exam details) */}
        <div className="grid grid-cols-12 gap-3 items-stretch my-1 text-left">
          {/* 1. Candidate Details Box (Col span 5) */}
          <div className="col-span-5 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
            <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-3 py-1 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="h-3 w-3" />
              <span>Candidate Details</span>
            </div>
            <div className="p-2 flex-1 flex flex-col justify-between text-[9.5px] leading-relaxed">
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Admit Card No.</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-mono font-bold text-rose-600">{admitCardNo}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Candidate Name</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-extrabold text-[#0c3e8a] uppercase">{student.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Father's & Mother's Name</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-semibold text-slate-800 truncate">{student.fatherName} / {student.motherName || "—"}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Date of Birth</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-semibold text-slate-800">{formattedDob}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Gender</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-semibold text-slate-800 uppercase">{student.gender || "MALE"}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Category</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-semibold text-slate-800 uppercase">{student.category || "GEN"}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Educational Qualification</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-semibold text-slate-800">Graduate</span>
                </div>
                <div className="flex items-center">
                  <span className="w-[38%] text-slate-700 font-bold">Application ID</span>
                  <span className="w-[4%] font-bold text-slate-500">:</span>
                  <span className="w-[58%] font-mono font-semibold text-slate-800">{appId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Photo Column (Col span 2) */}
          <div className="col-span-2 border border-slate-300 rounded-lg p-2 flex flex-col items-center justify-between bg-white text-center">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[95px] w-[75px] border border-dashed border-slate-400 rounded flex items-center justify-center bg-slate-50 overflow-hidden relative">
                {student.profilePicUrl ? (
                  <img src={resolveFileUrl(student.profilePicUrl)} className="h-full w-full object-cover" alt="Candidate Photo" />
                ) : (
                  <svg className="w-10 h-10 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0 1 12.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" />
                  </svg>
                )}
              </div>
              <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider mt-2 block leading-tight">
                Recent Passport<br />Size Photograph
              </span>
            </div>
          </div>

          {/* 3. Examination Details Box & QR Code (Col span 5) */}
          <div className="col-span-5 grid grid-cols-12 gap-2 items-stretch">
            {/* Exam Details (Col span 9) */}
            <div className="col-span-9 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
              <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-3 py-1 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                <span>Examination Details</span>
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between text-[9.5px] leading-relaxed">
                <div className="space-y-1">
                  <div className="flex items-start">
                    <span className="w-[38%] text-slate-700 font-bold shrink-0">Examination Name</span>
                    <span className="w-[4%] font-bold text-slate-500 shrink-0">:</span>
                    <span className="w-[58%] font-semibold text-slate-800 leading-tight">{examName}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-[38%] text-slate-700 font-bold shrink-0">Examination Type</span>
                    <span className="w-[4%] font-bold text-slate-500 shrink-0">:</span>
                    <span className="w-[58%] font-semibold text-slate-800 leading-tight">{examType}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[38%] text-slate-700 font-bold">Examination Date</span>
                    <span className="w-[4%] font-bold text-slate-500">:</span>
                    <span className="w-[58%] font-bold text-[#0c3e8a]">{formattedExamDate}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[38%] text-slate-700 font-bold">Reporting Time</span>
                    <span className="w-[4%] font-bold text-slate-500">:</span>
                    <span className="w-[58%] font-semibold text-slate-800">{formattedLoginTime}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[38%] text-slate-700 font-bold">Gate Closing Time</span>
                    <span className="w-[4%] font-bold text-slate-500">:</span>
                    <span className="w-[58%] font-semibold text-slate-800">{formattedGateClosingTime}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[38%] text-slate-700 font-bold">Examination Time</span>
                    <span className="w-[4%] font-bold text-slate-500">:</span>
                    <span className="w-[58%] font-semibold text-slate-800">{formattedStartTime}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-[38%] text-slate-700 font-bold shrink-0">Examination Centre</span>
                    <span className="w-[4%] font-bold text-slate-500 shrink-0">:</span>
                    <span className="w-[58%] font-semibold text-slate-800 leading-tight">Online (Remote Proctored)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[38%] text-slate-700 font-bold">Centre Code</span>
                    <span className="w-[4%] font-bold text-slate-500">:</span>
                    <span className="w-[58%] font-semibold text-slate-800">ONLINE-01</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[38%] text-slate-700 font-bold">District</span>
                    <span className="w-[4%] font-bold text-slate-500">:</span>
                    <span className="w-[58%] font-semibold text-slate-800 uppercase">{student.district || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Container (Col span 3) */}
            <div className="col-span-3 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
              <div className="bg-[#0c3e8a] text-white text-[8px] font-bold py-1 text-center uppercase tracking-wider">
                QR Code
              </div>
              <div className="p-1 flex-1 flex flex-col items-center justify-center text-center">
                <img src={qrCodeUrl} className="h-14 w-14 object-contain" alt="QR Code" />
                <span className="text-[6px] font-bold text-slate-500 mt-1 block leading-tight">
                  Scan to Verify<br />Admit Card
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section (Declaration, Instructions, Disclaimer) */}
        <div className="grid grid-cols-12 gap-3 items-stretch my-1">
          {/* Candidate Declaration (Col span 3) */}
          <div className="col-span-3 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
            <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-1 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="h-3 w-3" />
              <span>Candidate Declaration</span>
            </div>
            <div className="p-2 flex-1 flex flex-col justify-between">
              <p className="text-[7px] leading-relaxed text-slate-600">
                I hereby declare that all information furnished by me is true and correct. I agree to abide by all examination rules and instructions issued by the organizers.
              </p>
              <div className="border-t border-slate-300 mt-4 pt-1 flex flex-col items-center">
                <div className="h-5 w-full flex items-center justify-center overflow-hidden">
                  {student.signatureUrl ? (
                    <img src={resolveFileUrl(student.signatureUrl)} className="h-full object-contain" alt="Signature" />
                  ) : (
                    <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: "11px", color: "#1c3d5a" }} className="italic font-bold select-none">
                      {student.name}
                    </div>
                  )}
                </div>
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">Candidate Signature</span>
              </div>
            </div>
          </div>

          {/* Important Instructions (Col span 5) */}
          <div className="col-span-5 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
            <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-1 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertCircle className="h-3 w-3" />
              <span>Important Instructions</span>
            </div>
            <div className="p-2 flex-1 text-[6.5px] leading-snug text-slate-600 space-y-0.5">
              <p>1. Candidates must carry a printed copy of this Admit Card along with a valid Photo Identity Proof.</p>
              <p>2. Entry to the examination hall will not be permitted after the gate closing time.</p>
              <p>3. Mobile phones, smart watches, Bluetooth devices, calculators and any electronic gadgets are strictly prohibited.</p>
              <p>4. Candidates must occupy only their allotted seats.</p>
              <p>5. Any form of unfair practice, impersonation or misconduct may lead to cancellation of candidature.</p>
              <p>6. Candidates are advised to reach the examination venue at least 30 minutes before the reporting time.</p>
              <p>7. The decision of the Examination Authority shall be final and binding in all matters related to the examination.</p>
            </div>
          </div>

          {/* Disclaimer (Col span 4) */}
          <div className="col-span-4 border border-slate-300 rounded-lg overflow-hidden flex flex-col bg-white">
            <div className="bg-[#0c3e8a] text-white text-[8.5px] font-bold px-2 py-1 flex items-center gap-1.5 uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              <span>Disclaimer</span>
            </div>
            <div className="p-2 flex-1 text-[6px] leading-relaxed text-slate-500 text-justify">
              This Admit Card has been issued solely for participation in the Mock CBT Examination organized by Support Mission India for educational, assessment and practice purposes. This is NOT an Admit Card for any Government Recruitment Examination, WBCS Examination conducted by the Public Service Commission, UPSC Examination, Railway Examination, Banking Examination or any other official recruitment process. The examination is intended only to help candidates assess their preparation level and gain experience in a Computer Based Test (CBT) environment. If any individual reproduces, modifies, circulates, presents or uses this Admit Card for any unauthorized, fraudulent, misleading, illegal or dishonest purpose, Support Mission India shall not be held responsible or liable in any manner whatsoever. The entire responsibility for such misuse shall rest solely with the concerned individual. By appearing in this Mock CBT Examination, the candidate acknowledges and accepts all the above terms, conditions and disclaimers.
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="border-t border-slate-300 pt-2 mt-1 flex justify-between items-center text-[10px]">
          {/* Left: For Office Use Only */}
          <div className="border border-slate-300 rounded p-1.5 bg-slate-50/50 w-[280px]">
            <span className="text-[7.5px] font-black uppercase text-[#0c3e8a] tracking-wider block mb-1">
              ★ For Office Use Only
            </span>
            <div className="flex justify-between items-end gap-3 text-[9px]">
              <div className="flex-1 flex flex-col justify-end">
                <div className="flex items-center gap-1.5 h-6">
                  <span className="text-slate-500 font-semibold shrink-0">Invigilator Signature:</span>
                  <div className="h-5 flex-1 relative overflow-hidden">
                    <img src="/admit-signature.png" alt="Signature" className="max-h-full object-contain mix-blend-multiply" />
                  </div>
                </div>
                <div className="h-[1px] bg-slate-400 w-full mt-0.5"></div>
              </div>
              <div className="shrink-0 text-slate-700 font-bold pb-0.5">
                Attendance Status : <span className="text-slate-400 font-normal">Present / Absent</span>
              </div>
            </div>
          </div>

          {/* Center: Stamp Logo & Text */}
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full border border-emerald-600 p-0.5 flex items-center justify-center bg-emerald-50 shrink-0">
              <img src="/smi-logo.png" className="h-8 w-8 object-contain" alt="Stamp Logo" />
            </div>
            <div className="text-left leading-none">
              <span className="text-xs font-black text-slate-800 block">SUPPORT MISSION INDIA</span>
              <span className="text-[8px] font-bold text-slate-500 block mt-0.5">Examination & Assessment Cell</span>
              <span className="text-[8px] font-black text-emerald-700 tracking-wider block mt-0.5 border border-emerald-600 px-1 py-0.5 rounded bg-emerald-50 text-center uppercase">
                MOCK EXAM ADMIT
              </span>
            </div>
          </div>

          {/* Right: Computer Generated Message */}
          <div className="flex items-center gap-2 text-slate-500 text-[8px] leading-tight">
            <FileText className="h-6 w-6 text-slate-400 shrink-0" />
            <div>
              <p className="font-bold">This Admit Card is computer generated.</p>
              <p>No signature is required.</p>
            </div>
          </div>
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
                    `https://smi.in.net/verify?reg=${candidate?.registrationId || "N/A"}&id=${res._id}`
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
      <header className="h-16 border-b border-slate-200/80 backdrop-blur-md bg-white/80 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 print:hidden">
        <button
          type="button"
          onClick={() => {
            setActiveTab("courses");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer"
          aria-label="Go to dashboard home"
        >
          <Logo iconSize="sm" showText={false} />
          <div className="text-left min-w-0">
            <span className="font-extrabold tracking-tight text-slate-900 block text-xs sm:text-sm truncate leading-tight">
              SUPPORT MISSION INDIA
            </span>
            <span className="text-[9px] uppercase font-bold text-deepskyblue-dark tracking-wider hidden sm:block">
              Student Portal
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={handleSignOut}
            className="lg:hidden flex items-center gap-1.5 py-2 px-2.5 sm:px-3 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Notifications */}
          <button className="relative h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer hidden sm:flex">
            <Bell className="h-4 w-4 text-slate-600" />
            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-deepskyblue" />
          </button>
          {/* User Profile Summary */}
          <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-slate-250">
            {renderProfileAvatar("h-8 w-8 rounded-full overflow-hidden")}
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-3">{candidate.name}</p>
              <p className="text-[9px] text-slate-400 font-semibold mt-1">{candidate.registrationId}</p>
            </div>
          </div>
        </div>
      </header>

      {/* BODY CONTENT CONTAINER */}
      <div className="flex-1 flex w-full relative">
        {isDashboardLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-8 animate-fade-in py-16">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Locked</h2>
              <p className="text-sm text-slate-550 leading-relaxed max-w-md mx-auto">
                This is a premium, paid program: <span className="font-bold text-slate-800">{candidate.course}</span>. Please complete your enrollment payment to unlock all lectures, notes, attendance history, quizzes, and certificates.
              </p>
            </div>

            <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Course Enrollment Fee</span>
                <span className="text-3xl font-black text-slate-900 leading-tight">₹{courseData?.price || 0}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">One-time payment, lifetime syllabus access</span>
              </div>

              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm shadow-md shadow-deepskyblue/25 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {paymentLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Unlock Enrolled Course</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSignOut}
                className="text-xs font-bold text-slate-400 hover:text-rose-650 hover:bg-rose-50 px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Sign Out Session
              </button>
            </div>
          </div>
        ) : (
          <>
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
                <span>Exam</span>
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
          
          {/* Live Classes Card Banner (Red Card) */}
          {liveClasses && liveClasses.length > 0 && (
            <div className="mb-6 space-y-3 max-w-4xl">
              {liveClasses.map((liveClass: any) => {
                const now = new Date();
                const start = new Date(liveClass.startTime);
                const end = new Date(liveClass.endTime);
                const isActive = now >= start && now < end;
                
                return (
                  <div key={liveClass._id} className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 border border-red-500 text-white shadow-lg relative overflow-hidden animate-pulse-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="absolute right-0 top-0 h-40 w-40 bg-white/5 blur-2xl rounded-full pointer-events-none" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                          {isActive ? "Live Class Now" : "Upcoming Class"}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold mt-2">{liveClass.className}</h3>
                      <p className="text-xs text-rose-100 font-semibold mt-1">
                        Timing: {new Date(liveClass.startTime).toLocaleDateString()} {new Date(liveClass.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(liveClass.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {isActive ? (
                      <a
                        href={liveClass.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-6 rounded-xl bg-white text-red-600 font-bold text-xs hover:bg-rose-50 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Join Class</span>
                      </a>
                    ) : (
                      <button
                        disabled
                        className="py-2.5 px-6 rounded-xl bg-white/25 text-white/80 font-bold text-xs cursor-not-allowed border border-white/10"
                      >
                        Waiting for Time
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
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
                {courseData?.duration && (
                  <p className="text-[11px] text-deepskyblue-dark font-bold mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Program Duration: {courseData.duration}
                  </p>
                )}
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
                        {dayObj.date && (
                          <span className="text-[8px] text-slate-500 font-bold block leading-tight mt-0.5">
                            {new Date(dayObj.date).toLocaleString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
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
                    {quizzes.map((quiz) => {
                      const result = results.find((r) => r.quizId === quiz._id);
                      const meta = quiz.examMeta || {};
                      const isNotStarted = meta.isNotStarted ?? isExamNotStarted(quiz.scheduledAt);
                      const isWindowClosed =
                        meta.isWindowClosed ?? isExamWindowClosed(quiz.scheduledAt, quiz.duration || 30);
                      const canResume = meta.canResume;
                      const isSubmitted = quiz.isSubmitted || !!result;
                      const questionCount = quiz.questionCount ?? quiz.questions?.length ?? 0;
                      const answeredCount = meta.answeredCount ?? 0;
                      const scheduleLabel =
                        quiz.scheduledAtDisplay || formatExamSchedule(quiz.scheduledAt);
                      const windowEndLabel = formatExamWindowEnd(quiz.scheduledAt, quiz.duration || 30);

                      return (
                        <div
                          key={quiz._id}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm shadow-slate-100"
                        >
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            <div
                              className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
                                isSubmitted
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  : isNotStarted
                                    ? "bg-amber-50 border-amber-200 text-amber-600"
                                    : isWindowClosed
                                      ? "bg-slate-100 border-slate-200 text-slate-400"
                                      : canResume
                                        ? "bg-violet-50 border-violet-200 text-violet-600"
                                        : "bg-deepskyblue/10 border-deepskyblue/20 text-deepskyblue"
                              }`}
                            >
                              <Award className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-800 leading-snug break-words">
                                {quiz.title}
                              </h4>

                              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                  <FileText className="h-3 w-3 text-slate-400" />
                                  {questionCount} Objective {questionCount === 1 ? "Question" : "Questions"}
                                </span>

                                {quiz.duration ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    {quiz.duration} Mins
                                  </span>
                                ) : null}

                                {scheduleLabel && scheduleLabel !== "Now" ? (
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                                      isNotStarted
                                        ? "text-amber-700 bg-amber-50 border-amber-200"
                                        : isWindowClosed
                                          ? "text-slate-600 bg-slate-100 border-slate-200"
                                          : "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    }`}
                                  >
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    <span className="whitespace-normal sm:whitespace-nowrap">
                                      {isNotStarted ? "Starts" : "Started"}: {scheduleLabel}
                                    </span>
                                  </span>
                                ) : null}

                                {!isNotStarted && !isWindowClosed && meta.remainingSeconds ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-deepskyblue-dark bg-deepskyblue/10 border border-deepskyblue/20 px-2.5 py-1 rounded-lg">
                                    <Clock className="h-3 w-3" />
                                    Join until {windowEndLabel}
                                  </span>
                                ) : null}

                                {canResume && answeredCount > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-lg">
                                    <CheckCircle className="h-3 w-3" />
                                    Saved: {answeredCount}/{questionCount} answered
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 justify-end shrink-0 sm:pl-2">
                            {isSubmitted ? (
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                                  {result?.score !== undefined ? "Grade" : "Submitted"}
                                </span>
                                {result?.score !== undefined ? (
                                  <span className="text-xs text-emerald-650 font-bold">
                                    Score: {result.score}/{result.total} ({result.grade})
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-600 font-bold">Awaiting review</span>
                                )}
                              </div>
                            ) : isNotStarted ? (
                              <button
                                disabled
                                className="min-w-[108px] py-2 px-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 cursor-not-allowed"
                              >
                                Not Started
                              </button>
                            ) : isWindowClosed ? (
                              <button
                                disabled
                                className="min-w-[108px] py-2 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 cursor-not-allowed"
                              >
                                Window Closed
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartQuiz(quiz)}
                                className={`min-w-[108px] py-2 px-4 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 cursor-pointer transition-colors ${
                                  canResume
                                    ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/10"
                                    : "bg-deepskyblue hover:bg-deepskyblue-dark shadow-deepskyblue/10"
                                }`}
                              >
                                {canResume ? "Resume Exam" : "Start Exam"}
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
                  {results.length > 0 && (
                    <button
                      onClick={() => approvedResults.length > 0 && triggerPrint("cumulative_marksheet", approvedResults)}
                      disabled={approvedResults.length === 0}
                      className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${
                        approvedResults.length > 0
                          ? "bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer"
                          : "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Mark Sheet</span>
                    </button>
                  )}
                  {results.length > 0 && (
                    <button
                      onClick={() => {
                        const latestApprovedCert = [...results].reverse().find(r => r.isCertificateApproved);
                        if (latestApprovedCert) {
                          triggerPrint("certificate", latestApprovedCert);
                        }
                      }}
                      disabled={!results.some(r => r.isCertificateApproved)}
                      className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold shadow transition-all active:scale-[0.98] ${
                        results.some(r => r.isCertificateApproved)
                          ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-amber-500/10 cursor-pointer"
                          : "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>Print Certificate</span>
                    </button>
                  )}
                </div>
              </div>

              {results.length > 0 && approvedResults.length < results.length && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-250 flex items-start gap-3 print:hidden">
                  <AlertCircle className="h-5.5 w-5.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-800">Results Verification Pending</h4>
                    <p className="text-[10px] text-amber-650 font-semibold mt-0.5 animate-pulse">
                      Some of your completed exam records are currently undergoing verification by the academic board. Individual marksheets and certificates will become downloadable once approved by the administrator.
                    </p>
                  </div>
                </div>
              )}

              {results.length > 0 ? (
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
                    <span className="font-bold text-deepskyblue-dark print:text-zinc-800">{courseData?.code || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Course Name</span>
                    <span className="font-semibold text-slate-700 print:text-black">{candidate.course}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Program Duration</span>
                    <span className="font-semibold text-slate-700 print:text-black">{courseData?.duration || "N/A"}</span>
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
                                    onClick={() => res.isApproved && triggerPrint("marksheet", res.originalData)}
                                    disabled={!res.isApproved}
                                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition ${
                                      res.isApproved
                                        ? "bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                        : "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                    }`}
                                    title={res.isApproved ? "Print Marksheet" : "Pending Approval"}
                                  >
                                    Marksheet
                                  </button>
                                  <button
                                    onClick={() => res.isCertificateApproved && triggerPrint("certificate", res.originalData)}
                                    disabled={!res.isCertificateApproved}
                                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition ${
                                      res.isCertificateApproved
                                        ? "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow shadow-amber-500/10 cursor-pointer"
                                        : "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                    }`}
                                    title={res.isCertificateApproved ? "Print Certificate" : "Certificate Not Approved"}
                                  >
                                    Certificate
                                  </button>
                                  <button
                                    onClick={() => res.isApproved && handleReviewAnswers(res.originalData)}
                                    disabled={!res.isApproved}
                                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition ${
                                      res.isApproved
                                        ? "bg-deepskyblue hover:bg-deepskyblue-dark text-white shadow shadow-deepskyblue/10 cursor-pointer"
                                        : "bg-slate-50 border border-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                                    }`}
                                    title={res.isApproved ? "Review Answers" : "Pending Approval"}
                                  >
                                    Review
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
              ) : (
                <div className="p-10 rounded-2xl bg-white border border-rose-200 shadow-sm shadow-slate-100 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in mt-8">
                  <div className="h-16 w-16 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                    <AlertCircle className="h-8 w-8 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">No Results Found</h3>
                    <p className="text-sm text-slate-500 font-medium max-w-md mx-auto mt-2">
                      You are not eligible for a marksheet and certificate. Please complete your assigned semester exams first to generate your verified results.
                    </p>
                  </div>
                </div>
              )}
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
                  {renderProfileAvatar(
                    "h-20 w-20 rounded-2xl overflow-hidden shadow-lg shadow-deepskyblue/10",
                    "text-2xl font-black text-white"
                  )}
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
                      <button
                        onClick={() => triggerPrint("idcard", candidate)}
                        className="inline-flex items-center gap-1.5 py-1 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-[10px] font-bold text-white rounded-xl shadow-md cursor-pointer transition active:scale-95"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print ID Card</span>
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
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">District</span>
                    <span className="font-semibold text-slate-800">{candidate.district || "N/A"}</span>
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

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Uploaded Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Profile Picture", url: candidate.profilePicUrl },
                      { label: "Admit Card", url: candidate.admitUrl },
                      { label: "Qualification Certificate", url: candidate.qualificationUrl },
                      { label: "Extra Qualification", url: candidate.extraQualificationUrl },
                    ]
                      .filter((doc) => doc.url)
                      .map((doc) => (
                        <a
                          key={doc.label}
                          href={resolveFileUrl(doc.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <span>{doc.label}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-deepskyblue" />
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
          </>
        )}
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
                  {savingProgress ? (
                    <span className="text-[10px] font-bold text-emerald-600">Saving...</span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">Progress auto-saved</span>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  if (activeQuiz?._id) {
                    await saveExamProgress(selectedAnswers, activeQuiz._id);
                    toast.success("Progress saved. You can resume later from where you left off.");
                  }
                  examExpiresAtRef.current = null;
                  setActiveQuiz(null);
                }}
                className="text-slate-650 hover:text-slate-950 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                Save & Exit
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

      {/* QUIZ REVIEW MODAL */}
      {(reviewResult || loadingReview) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-slate-250 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-left">
            <div className="flex justify-between items-start border-b border-slate-150 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                  {loadingReview ? "Loading Review..." : reviewQuiz?.title}
                </h3>
                {!loadingReview && reviewResult && (
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400 font-semibold">Course: {reviewQuiz?.course}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-350" />
                    <span className="text-xs font-bold text-deepskyblue-dark">
                      Score: {reviewResult.score} / {reviewResult.total} ({reviewResult.percentage}%) - {reviewResult.grade}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setReviewResult(null);
                  setReviewQuiz(null);
                }}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                Close Review
              </button>
            </div>

            {loadingReview ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-10 w-10 border-4 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Exam Submission Details...</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Score breakdown metrics cards */}
                <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 border border-slate-200/80 rounded-2xl">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Correct</span>
                    <span className="text-lg font-black text-emerald-600 mt-0.5 block">{reviewResult.correctCount}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Incorrect</span>
                    <span className="text-lg font-black text-rose-500 mt-0.5 block">{reviewResult.incorrectCount}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Result Status</span>
                    <span className={`text-lg font-black mt-0.5 block ${reviewResult.percentage >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                      {reviewResult.percentage >= 50 ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>

                {reviewQuiz?.questions?.map((question: any, qIdx: number) => {
                  const studentAnsIdx = reviewResult.answers ? reviewResult.answers[qIdx] : -1;
                  const correctAnsIdx = question.correctAnswerIndex;
                  const isCorrect = studentAnsIdx === correctAnsIdx;

                  return (
                    <div key={qIdx} className={`space-y-3 p-4 border rounded-2xl ${
                      isCorrect 
                        ? "bg-emerald-50/20 border-emerald-150" 
                        : "bg-rose-50/10 border-rose-150"
                    }`}>
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="text-xs font-bold text-slate-800 leading-normal">
                          Q{qIdx + 1}. {question.questionText}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 ${
                          isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {isCorrect ? `+${question.marks || 1} Marks` : "0 Marks"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {question.options.map((opt: string, optIdx: number) => {
                          const isStudentSelected = studentAnsIdx === optIdx;
                          const isCorrectChoice = correctAnsIdx === optIdx;

                          let btnStyle = "bg-white border-slate-200 text-slate-600";
                          if (isCorrectChoice) {
                            btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-500/10";
                          } else if (isStudentSelected) {
                            btnStyle = "bg-rose-50 border-rose-500 text-rose-700 shadow-sm shadow-rose-500/10";
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border font-bold flex items-center justify-between ${btnStyle}`}
                            >
                              <div className="flex items-center min-w-0">
                                <span className={`inline-block h-4 w-4 rounded-full border mr-2 text-center text-[9px] font-black uppercase leading-4 shrink-0 select-none ${
                                  isCorrectChoice ? "bg-emerald-100 border-emerald-300 text-emerald-750" :
                                  isStudentSelected ? "bg-rose-100 border-rose-300 text-rose-750" : "bg-slate-50 border-slate-300 text-slate-500"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="truncate pr-2">{opt}</span>
                              </div>

                              {isCorrectChoice && (
                                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">Correct Key</span>
                              )}
                              {!isCorrectChoice && isStudentSelected && (
                                <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded shrink-0">Your Choice</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM MENU BAR */}
      {!isDashboardLocked && (
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

        {/* Exams */}
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
            Exams
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
      )}

      {/* PRINT AREA CONTAINER (Hidden on screen, shown in printing) */}
      <div id="print-area-wrapper" className="hidden print:block">
        {printTarget?.type === "marksheet" && renderPrintMarksheet(printTarget.data)}
        {printTarget?.type === "cumulative_marksheet" && renderPrintCumulativeMarksheet(printTarget.data)}
        {printTarget?.type === "certificate" && renderPrintCertificate(printTarget.data)}
        {printTarget?.type === "admitcard" && renderPrintAdmitCard(printTarget.data)}
        {printTarget?.type === "idcard" && renderPrintIdCard(printTarget.data)}
      </div>

    </div>
  );
}
