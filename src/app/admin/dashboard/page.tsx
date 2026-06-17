"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Award,
  Plus,
  Trash,
  LogOut,
  Bell,
  Sparkles,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Upload,
  UserPlus,
  Search,
  Menu,
  BookMarked,
  Printer
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [admin, setAdmin] = useState<any>(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const [stats, setStats] = useState({
    studentsCount: 0,
    coursesCount: 0,
    papersCount: 0,
    quizzesCount: 0
  });

  // Data Lists
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [papersList, setPapersList] = useState<any[]>([]);
  const [quizzesList, setQuizzesList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [resultsList, setResultsList] = useState<any[]>([]);

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Student Lookup Detail States
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [modalActiveTab, setModalActiveTab] = useState<string>("profile");
  const [printTarget, setPrintTarget] = useState<any>(null);

  // ================= FORM STATES =================
  // 1. Create Course
  const [courseForm, setCourseForm] = useState({
    title: "",
    code: "",
    description: "",
    duration: "1 Year"
  });

  // 2. Register Student
  const [studentForm, setStudentForm] = useState({
    name: "",
    fatherName: "",
    motherName: "",
    dob: "",
    email: "",
    phone: "",
    address: "",
    course: "",
    admitUrl: "",
    qualificationUrl: "",
    extraQualificationUrl: "",
    password: ""
  });
  const [uploadingAdmit, setUploadingAdmit] = useState(false);
  const [uploadingQual, setUploadingQual] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  // 3. Log Attendance
  const [attendanceForm, setAttendanceForm] = useState({
    candidateId: "",
    date: new Date().toISOString().split("T")[0],
    status: "present",
    googleMeetLink: ""
  });

  // 4. Upload Question Paper
  const [paperForm, setPaperForm] = useState({
    title: "",
    course: "",
    fileUrl: "",
    status: "pending",
    score: "--",
    type: "exam_paper"
  });
  const [uploadingPaper, setUploadingPaper] = useState(false);

  // 5. Create Quiz
  const [quizForm, setQuizForm] = useState({
    title: "",
    course: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    duration: 30,
    assignedStudents: [] as string[],
    examPassword: "",
    questions: [
      {
        questionText: "",
        options: ["", "", "", ""],
        correctAnswerIndex: 0,
        marks: 1
      }
    ]
  });

  // Course-specific PDF upload states
  const [uploadingForCourse, setUploadingForCourse] = useState<string | null>(null);
  const [coursePaperForm, setCoursePaperForm] = useState({
    title: "",
    type: "book",
    fileUrl: "",
    status: "pending",
    score: "--"
  });
  const [uploadingCoursePdf, setUploadingCoursePdf] = useState(false);

  // ================= FETCH LOGIC =================
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          setAdmin(data.admin);
          await fetchAllData();
          setLoading(false);
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/admin/login");
      }
    };
    checkAdmin();
  }, [router]);

  const fetchAllData = async () => {
    try {
      // Fetch Students
      const resStudents = await fetch("/api/admin/users");
      const dataStudents = await resStudents.json();
      const students = dataStudents.students || [];
      setStudentsList(students);

      // Fetch Courses
      const resCourses = await fetch("/api/admin/courses");
      const dataCourses = await resCourses.json();
      const courses = dataCourses.courses || [];
      setCoursesList(courses);

      // Fetch Question Papers
      const resPapers = await fetch("/api/admin/papers");
      const dataPapers = await resPapers.json();
      const papers = dataPapers.papers || [];
      setPapersList(papers);

      // Fetch Quizzes
      const resQuizzes = await fetch("/api/admin/quizzes");
      const dataQuizzes = await resQuizzes.json();
      const quizzes = dataQuizzes.quizzes || [];
      setQuizzesList(quizzes);

      // Fetch Attendance Summary
      const resAttendance = await fetch("/api/admin/attendance");
      const dataAttendance = await resAttendance.json();
      const attendance = dataAttendance.attendance || [];
      setAttendanceList(attendance);

      // Fetch Results
      const resResults = await fetch("/api/admin/results");
      const dataResults = await resResults.json();
      const results = dataResults.results || [];
      setResultsList(results);

      // Update Stats
      setStats({
        studentsCount: students.length,
        coursesCount: courses.length,
        papersCount: papers.length,
        quizzesCount: quizzes.length
      });
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/auth/logout", {
        method: "POST"
      });
      if (res.ok) {
        router.push("/admin/login");
      }
    } catch (err) {
      console.error(err);
      router.push("/admin/login");
    }
  };

  // ================= FILE UPLOAD LOGIC =================
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "admitUrl" | "qualificationUrl" | "extraQualificationUrl" | "paperUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "admitUrl") setUploadingAdmit(true);
    else if (field === "qualificationUrl") setUploadingQual(true);
    else if (field === "extraQualificationUrl") setUploadingExtra(true);
    else setUploadingPaper(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data
      });

      const result = await res.json();
      if (res.ok && result.url) {
        if (field === "paperUrl") {
          setPaperForm(prev => ({ ...prev, fileUrl: result.url }));
        } else {
          setStudentForm(prev => ({ ...prev, [field]: result.url }));
        }
        setSuccessMsg(`File uploaded successfully: ${file.name}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(result.error || "File upload failed.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error uploading file.");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      if (field === "admitUrl") setUploadingAdmit(false);
      else if (field === "qualificationUrl") setUploadingQual(false);
      else if (field === "extraQualificationUrl") setUploadingExtra(false);
      else setUploadingPaper(false);
    }
  };

  // ================= SUBMISSION HANDLERS =================
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const standardModules = [
      { title: "Module 1: Foundations", topics: "Core Concepts & Fundamentals", progress: 0, color: "from-deepskyblue to-sky-600" },
      { title: "Module 2: Advanced Applications", topics: "Practical Labs & Integration Projects", progress: 0, color: "from-deepskyblue-dark to-sky-700" },
      { title: "Module 3: Project Administration", topics: "Case Studies & S3 Deployment Checks", progress: 0, color: "from-deepskyblue to-sky-600" },
      { title: "Module 4: Security & Compliance", topics: "Vulnerabilities Audits & Exam prep", progress: 0, color: "from-deepskyblue-dark to-sky-700" }
    ];

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...courseForm, modules: standardModules })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Course created successfully!");
        setCourseForm({ title: "", code: "", description: "", duration: "1 Year" });
        await fetchAllData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to create course.");
      }
    } catch (err) {
      setErrorMsg("Network error creating course.");
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Student registered! Registration ID: ${data.student.registrationId}`);
        setStudentForm({
          name: "", fatherName: "", motherName: "", dob: "", email: "", phone: "",
          address: "", course: "", admitUrl: "", qualificationUrl: "", extraQualificationUrl: "", password: ""
        });
        await fetchAllData();
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        setErrorMsg(data.error || "Failed to create student account.");
      }
    } catch (err) {
      setErrorMsg("Network error registering student.");
    }
  };

  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Attendance log created successfully.");
        setAttendanceForm(prev => ({ ...prev, googleMeetLink: "" }));
        await fetchAllData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to record attendance.");
      }
    } catch (err) {
      setErrorMsg("Network error logging attendance.");
    }
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paperForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Question paper added successfully.");
        setPaperForm({ title: "", course: "", fileUrl: "", status: "pending", score: "--", type: "exam_paper" });
        await fetchAllData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to log question paper.");
      }
    } catch (err) {
      setErrorMsg("Network error adding question paper.");
    }
  };

  const handleCoursePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCoursePdf(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data
      });

      const result = await res.json();
      if (res.ok && result.url) {
        setCoursePaperForm(prev => ({ ...prev, fileUrl: result.url }));
        setSuccessMsg(`File uploaded successfully: ${file.name}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(result.error || "File upload failed.");
        setTimeout(() => setErrorMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error uploading file.");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setUploadingCoursePdf(false);
    }
  };

  const handleCreateCoursePaper = async (courseTitle: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!coursePaperForm.fileUrl) {
      setErrorMsg("Please upload a PDF file first.");
      return;
    }

    try {
      const res = await fetch("/api/admin/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: coursePaperForm.title,
          course: courseTitle,
          type: coursePaperForm.type,
          fileUrl: coursePaperForm.fileUrl,
          status: coursePaperForm.status,
          score: coursePaperForm.score
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Document PDF uploaded directly to course successfully.");
        setCoursePaperForm({ title: "", type: "book", fileUrl: "", status: "pending", score: "--" });
        setUploadingForCourse(null);
        await fetchAllData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to save course paper.");
      }
    } catch (err) {
      setErrorMsg("Network error saving course paper.");
    }
  };

  // ================= QUIZ BUILDER HANDLERS =================
  const handleQuizQuestionChange = (qIndex: number, val: string) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[qIndex].questionText = val;
    setQuizForm(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleQuizOptionChange = (qIndex: number, optIndex: number, val: string) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[qIndex].options[optIndex] = val;
    setQuizForm(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleQuizCorrectIndexChange = (qIndex: number, val: number) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[qIndex].correctAnswerIndex = val;
    setQuizForm(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleQuizMarksChange = (qIndex: number, val: number) => {
    const updatedQuestions = [...quizForm.questions];
    updatedQuestions[qIndex].marks = val;
    setQuizForm(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const addQuizQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, marks: 1 }
      ]
    }));
  };

  const removeQuizQuestion = (qIndex: number) => {
    if (quizForm.questions.length <= 1) return;
    const updatedQuestions = quizForm.questions.filter((_, idx) => idx !== qIndex);
    setQuizForm(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Quiz created and assigned successfully!");
        setQuizForm({
          title: "",
          course: "",
          scheduledAt: new Date().toISOString().slice(0, 16),
          duration: 30,
          assignedStudents: [] as string[],
          examPassword: "",
          questions: [{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0, marks: 1 }]
        });
        await fetchAllData();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to create quiz.");
      }
    } catch (err) {
      setErrorMsg("Network error creating quiz.");
    }
  };

  const handleViewStudentDetails = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingDetails(true);
    setModalActiveTab("profile");
    try {
      const res = await fetch(`/api/admin/users/${studentId}/details`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudentDetails({
          student: data.student,
          attendance: data.attendance,
          results: data.results,
        });
      } else {
        alert(data.error || "Failed to load student details");
        setSelectedStudentId(null);
      }
    } catch (err) {
      console.error(err);
      alert("Network error fetching student details");
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const triggerPrint = (type: "marksheet" | "certificate" | "cumulative_marksheet", data: any) => {
    setPrintTarget({ type, data });
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const renderPrintCertificate = (res: any) => {
    if (!res) return null;
    const totalQuestions = res.correctCount + res.incorrectCount;
    const formattedDate = new Date(res.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const candidateName = studentDetails?.student?.name || res.candidateId?.name || "[Candidate Name]";

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
              {candidateName}
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
                    `https://supportmissionindia.org/verify?reg=${studentDetails?.student?.registrationId || res.candidateId?.registrationId || "N/A"}&id=${res._id}`
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
    const candidateName = studentDetails?.student?.name || res.candidateId?.name || "N/A";
    const regId = studentDetails?.student?.registrationId || res.candidateId?.registrationId || "N/A";
    const courseName = studentDetails?.student?.course || res.candidateId?.course || "N/A";

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
          <div className="mt-8 grid grid-cols-3 gap-4 bg-slate-55 p-4 rounded-xl border border-slate-200/60">
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
            <p className="font-serif italic text-xs text-slate-655 h-6">Dr. K. Verma</p>
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
    const candidateName = studentDetails?.student?.name || "N/A";
    const regId = studentDetails?.student?.registrationId || "N/A";
    const courseName = studentDetails?.student?.course || "N/A";

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
          <div className="mt-8 grid grid-cols-3 gap-4 bg-slate-55 p-4 rounded-xl border border-slate-200/60">
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
            <p className="font-serif italic text-xs text-slate-655 h-6">Dr. K. Verma</p>
            <div className="border-t border-slate-300 pt-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              Exam Controller
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans select-none">
        <div className="absolute w-[350px] h-[350px] rounded-full bg-deepskyblue/8 blur-[80px] animate-pulse" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/20 mb-2">
            <Shield className="h-6 w-6 text-white animate-spin" />
          </div>
          <p className="text-slate-505 text-sm font-bold tracking-wider uppercase animate-pulse">
            Booting Administrator Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const courseOptions = coursesList.map(c => c.title);

  // Filter students based on search query
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ================= CHARTS DATA COMPUTATION =================
  // 1. Get monthly registration trend (6 months back to current)
  const trendData = (() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const last6Months: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last6Months.push({ name: months[idx], count: 0, monthNum: idx });
    }

    studentsList.forEach(student => {
      if (!student.createdAt) return;
      const date = new Date(student.createdAt);
      const studentMonth = date.getMonth();
      const match = last6Months.find(m => m.monthNum === studentMonth);
      if (match) {
        match.count += 1;
      }
    });

    const hasData = last6Months.some(m => m.count > 0);
    if (!hasData) {
      // Setup premium mock data points if no students exist yet
      last6Months[0].count = 5;
      last6Months[1].count = 12;
      last6Months[2].count = 8;
      last6Months[3].count = 16;
      last6Months[4].count = 21;
      last6Months[5].count = Math.max(26, stats.studentsCount);
    }
    return last6Months;
  })();

  const maxTrendVal = Math.max(...trendData.map(d => d.count), 10);
  const trendPaddingX = 40;
  const trendPaddingY = 30;
  const trendSvgWidth = 500;
  const trendSvgHeight = 200;
  const trendChartWidth = trendSvgWidth - trendPaddingX * 2;
  const trendChartHeight = trendSvgHeight - trendPaddingY * 2;

  const trendPoints = trendData.map((d, index) => {
    const x = trendPaddingX + (index / (trendData.length - 1)) * trendChartWidth;
    const y = trendPaddingY + trendChartHeight - (d.count / maxTrendVal) * trendChartHeight;
    return { x, y, label: d.name, count: d.count };
  });

  const trendLinePath = trendPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const trendAreaPath = trendPoints.length > 0
    ? `${trendLinePath} L ${trendPoints[trendPoints.length - 1].x} ${trendPaddingY + trendChartHeight} L ${trendPoints[0].x} ${trendPaddingY + trendChartHeight} Z`
    : "";

  // 2. Get course distribution (pie/donut)
  const courseDistribution = (() => {
    const counts: { [key: string]: number } = {};
    studentsList.forEach(student => {
      const c = student.course || "Other";
      counts[c] = (counts[c] || 0) + 1;
    });

    let slices = Object.entries(counts).map(([name, val]) => ({ name, val }));
    slices.sort((a, b) => b.val - a.val);

    if (slices.length === 0) {
      slices = [
        { name: "Diploma in Computer Application (DCA)", val: 15 },
        { name: "PGDCA Masterclass", val: 10 },
        { name: "Advanced Diploma in IT (ADIT)", val: 7 },
        { name: "Web Development", val: 12 },
        { name: "Other Program Courses", val: 6 }
      ];
    }

    const totalVal = slices.reduce((acc, s) => acc + s.val, 0);
    return { slices, totalVal };
  })();

  const donutRadius = 50;
  const donutCirc = 2 * Math.PI * donutRadius; // ~314.159
  const donutColors = [
    "#00bfff", // Deep Sky Blue
    "#008cff", // Vibrant Blue
    "#33ccff", // Sky Blue
    "#0ea5e9", // Tailwind Sky-500
    "#06b6d4", // Cyan-500
    "#10b981", // Emerald-500
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex font-sans select-none overflow-x-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 px-4 shrink-0 hidden lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-3 pb-5 border-b border-slate-100">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/20">
              <Shield className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-slate-900 text-sm uppercase">SMI ADMIN</span>
          </div>

          <div className="px-3 pt-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Management Panel</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "overview"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "overview" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <TrendingUp className="h-4 w-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("courses")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "courses"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "courses" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <BookOpen className="h-4 w-4" />
              <span>Manage Courses</span>
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "students"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "students" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <UserPlus className="h-4 w-4" />
              <span>Register Students</span>
            </button>

            <button
              onClick={() => setActiveTab("attendance")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "attendance"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "attendance" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <Calendar className="h-4 w-4" />
              <span>Manage Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab("papers")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "papers"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "papers" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <FileText className="h-4 w-4" />
              <span>Question Papers</span>
            </button>

            <button
              onClick={() => setActiveTab("quizzes")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "quizzes"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "quizzes" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <Award className="h-4 w-4" />
              <span>Create Exam</span>
            </button>

            <button
              onClick={() => setActiveTab("results")}
              className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:translate-x-1 ${
                activeTab === "results"
                  ? "bg-deepskyblue text-white shadow-md shadow-deepskyblue/20"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {activeTab === "results" && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md" />
              )}
              <CheckCircle className="h-4 w-4" />
              <span>Exam Results</span>
            </button>
          </nav>
        </div>

        {/* PROFILE SESSION CARD */}
        <div className="border-t border-slate-200 pt-4 mt-auto space-y-2">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="h-8 w-8 rounded-lg bg-deepskyblue flex items-center justify-center text-xs font-extrabold text-white shadow-sm shadow-deepskyblue/10">
              {admin?.name ? admin.name[0].toUpperCase() : "A"}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-855 truncate leading-3">{admin?.name || "Admin User"}</p>
              <p className="text-[9px] text-slate-400 font-semibold mt-1.5">Logged In</p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 border border-transparent rounded-xl text-xs font-bold text-slate-500 hover:text-rose-650 hover:bg-rose-50 transition-all text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DISPLAY CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 z-30">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:bg-slate-50">
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Search Input Box */}
            <div className="relative w-64 max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search candidates or programs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative h-8 w-8 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-550 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-deepskyblue" />
            </button>

            {/* Profile Avatar Widget */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                AD
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-3">{admin?.name}</p>
                <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* VIBRANT TOP BANNER SECTION */}
        <section className="bg-gradient-to-r from-deepskyblue via-deepskyblue to-sky-600 text-white px-8 pt-8 pb-20 relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight capitalize">{activeTab} Setup</h2>
            <p className="text-xs text-sky-50">Configure parameters, inspect course catalogs, and audit student databases</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold bg-white/20 border border-white/30 px-3 py-1 rounded-full text-white select-none">
              Portal Mode: Active
            </span>
          </div>
        </section>

        {/* OVERLAPPING METRICS CARDS */}
        <section className="relative -mt-12 z-10 grid grid-cols-1 sm:grid-cols-4 gap-6 px-8 max-w-7xl w-full mx-auto">
          {/* Card 1: Students */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-200/50 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Students Enrolled</span>
              <span className="text-2xl font-black text-slate-900">{stats.studentsCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">Portal verified logs</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-deepskyblue/10 flex items-center justify-center text-deepskyblue-dark">
              <Users className="h-5 w-5" />
            </div>
          </div>

          {/* Card 2: Courses */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-200/50 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Active Tasks / Courses</span>
              <span className="text-2xl font-black text-slate-900">{stats.coursesCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">Syllabi catalogs loaded</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
              <BookMarked className="h-5 w-5" />
            </div>
          </div>

          {/* Card 3: Papers */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-200/50 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Question Papers</span>
              <span className="text-2xl font-black text-slate-900">{stats.papersCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">Assigned static files</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>

          {/* Card 4: Exams */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-md shadow-slate-200/50 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Assigned Exams</span>
              <span className="text-2xl font-black text-slate-900">{stats.quizzesCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">Interactive online exams</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </section>

        {/* MAIN CONTAINER AREA */}
        <main className="p-8 max-w-7xl w-full mx-auto flex-1 flex flex-col gap-6">
          
          {/* Notification Messages */}
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= TAB CONTENT 1: OVERVIEW ================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              
              {/* CHARTS CONTAINER GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 1. Monthly Registration Trend */}
                <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 flex flex-col justify-between">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Monthly Registration Trend</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Audit trail of new candidate registrations over the last 6 months</p>
                  </div>
                  
                  {/* SVG Line Chart */}
                  <div className="relative w-full h-48">
                    <svg className="w-full h-full" viewBox={`0 0 ${trendSvgWidth} ${trendSvgHeight}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00bfff" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#00bfff" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                        const y = trendPaddingY + ratio * trendChartHeight;
                        const countLabel = Math.round(maxTrendVal - ratio * maxTrendVal);
                        return (
                          <g key={i} className="opacity-40">
                            <line
                              x1={trendPaddingX}
                              y1={y}
                              x2={trendPaddingX + trendChartWidth}
                              y2={y}
                              className="stroke-slate-200"
                              strokeWidth="1"
                              strokeDasharray="4 4"
                            />
                            <text
                              x={trendPaddingX - 10}
                              y={y + 3}
                              className="text-[9px] fill-slate-400 font-bold text-right font-sans"
                              textAnchor="end"
                            >
                              {countLabel}
                            </text>
                          </g>
                        );
                      })}

                      {/* Area fill */}
                      {trendAreaPath && (
                        <path
                          d={trendAreaPath}
                          fill="url(#trendGradient)"
                        />
                      )}

                      {/* Line path */}
                      {trendLinePath && (
                        <path
                          d={trendLinePath}
                          fill="none"
                          stroke="#00bfff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Data points & labels */}
                      {trendPoints.map((p, i) => (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            className="fill-white stroke-deepskyblue transition-all duration-200 hover:r-6"
                            strokeWidth="3.5"
                          />
                          <text
                            x={p.x}
                            y={p.y - 12}
                            className="text-[10px] font-extrabold fill-deepskyblue-dark font-sans"
                            textAnchor="middle"
                          >
                            {p.count}
                          </text>
                          <text
                            x={p.x}
                            y={trendPaddingY + trendChartHeight + 15}
                            className="text-[9px] fill-slate-400 font-black uppercase font-sans"
                            textAnchor="middle"
                          >
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* 2. Program Distribution / Course Share */}
                <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 flex flex-col justify-between">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Program Distribution</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Enrolled student percentage share by course catalog</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
                    {/* Donut Chart */}
                    <div className="relative flex items-center justify-center shrink-0">
                      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          className="fill-none stroke-slate-50"
                          strokeWidth="12"
                        />
                        {(() => {
                          let accumulatedPercent = 0;
                          return courseDistribution.slices.slice(0, 6).map((slice, i) => {
                            const percent = slice.val / courseDistribution.totalVal;
                            const strokeDasharray = `${percent * donutCirc} ${donutCirc}`;
                            const strokeDashoffset = -accumulatedPercent * donutCirc;
                            accumulatedPercent += percent;
                            const strokeColor = donutColors[i % donutColors.length];
                            return (
                              <circle
                                key={i}
                                cx="60"
                                cy="60"
                                r="50"
                                className="fill-none transition-all duration-300"
                                stroke={strokeColor}
                                strokeWidth="12"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="butt"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-slate-900">{courseDistribution.totalVal}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Students</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
                      {courseDistribution.slices.slice(0, 5).map((slice, i) => {
                        const percent = ((slice.val / courseDistribution.totalVal) * 100).toFixed(0);
                        const strokeColor = donutColors[i % donutColors.length];
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
                            <span className="text-slate-600 font-medium truncate flex-1 leading-none">{slice.name}</span>
                            <span className="text-slate-900 font-bold ml-auto">{percent}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* ACTIVE STUDENTS DATABASE */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-5">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Students Database</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Listing of portal verified registrations</p>
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-10 text-center font-medium">No candidate accounts found matching search.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                          <th className="pb-3 pl-2">Reg ID</th>
                          <th className="pb-3">Candidate Name</th>
                          <th className="pb-3">Enrolled Program</th>
                          <th className="pb-3">Email ID</th>
                          <th className="pb-3">Date Created</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((stud, idx) => (
                          <tr key={idx} className="text-slate-700 hover:bg-slate-50/50 hover:text-slate-900 transition-colors">
                            <td className="py-3.5 pl-2 font-bold text-deepskyblue-dark">{stud.registrationId}</td>
                            <td className="py-3.5 font-semibold">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-deepskyblue-dark select-none animate-pulse">
                                  {stud.name[0].toUpperCase()}
                                </div>
                                <span>{stud.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 text-slate-500 font-medium">{stud.course}</td>
                            <td className="py-3.5 text-slate-500 font-mono">{stud.email}</td>
                            <td className="py-3.5 text-slate-400 font-medium">
                              {new Date(stud.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 text-right pr-2">
                              <button
                                onClick={() => handleViewStudentDetails(stud._id)}
                                className="px-3 py-1.5 rounded-xl bg-deepskyblue/10 text-deepskyblue-dark text-[10px] font-extrabold hover:bg-deepskyblue hover:text-white transition cursor-pointer"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ================= TAB CONTENT 2: MANAGE COURSES ================= */}
          {activeTab === "courses" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Side: Create Form */}
              <form onSubmit={handleCreateCourse} className="md:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Create Course Program
                </h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADIT-2026"
                    value={courseForm.code}
                    onChange={e => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Diploma in IT"
                    value={courseForm.title}
                    onChange={e => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Program Duration</label>
                  <select
                    value={courseForm.duration}
                    onChange={e => setCourseForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Syllabus Overview</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe program syllabus description..."
                    value={courseForm.description}
                    onChange={e => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-xs shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Configure Course</span>
                </button>
              </form>

              {/* Right Side: Catalogue List */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Course Catalogue
                </h3>

                {coursesList.length === 0 ? (
                  <p className="text-xs text-slate-450 py-8 text-center font-medium">No database programs saved. (Displaying typical defaults).</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {coursesList.map((course, idx) => {
                      const coursePdfs = papersList.filter(p => p.course === course.title);
                      const isUploadingThis = uploadingForCourse === course.title;

                      return (
                        <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col gap-4">
                          {/* Main course info row */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold bg-deepskyblue/10 text-deepskyblue-dark px-2 py-0.5 rounded-full uppercase tracking-wider">{course.code}</span>
                              <h4 className="text-xs font-bold text-slate-800 mt-1">{course.title}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold">{course.duration} duration</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl h-fit">
                                <BookOpen className="h-3.5 w-3.5 text-deepskyblue" />
                                <span>{course.modules?.length || 0} Modules</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isUploadingThis) {
                                    setUploadingForCourse(null);
                                  } else {
                                    setUploadingForCourse(course.title);
                                    setCoursePaperForm({ title: "", type: "book", fileUrl: "", status: "pending", score: "--" });
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-deepskyblue hover:bg-deepskyblue-dark text-white rounded-xl text-[10px] font-bold cursor-pointer transition"
                              >
                                {isUploadingThis ? "Cancel" : "Add PDF"}
                              </button>
                            </div>
                          </div>

                          {/* Documents list */}
                          <div className="border-t border-slate-200/60 pt-3 space-y-2">
                            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Course Study Materials ({coursePdfs.length})</span>
                            {coursePdfs.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">No study materials uploaded for this course yet.</p>
                            ) : (
                              <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                                {coursePdfs.map((pdf, pIdx) => (
                                  <div key={pIdx} className="flex justify-between items-center bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10.5px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0 ${
                                        pdf.type === "book" ? "bg-sky-50 text-sky-600" :
                                        pdf.type === "note" ? "bg-emerald-50 text-emerald-600" : "bg-purple-50 text-purple-600"
                                      }`}>
                                        {pdf.type === "book" ? "Book" : pdf.type === "note" ? "Note" : "Paper"}
                                      </span>
                                      <span className="font-semibold text-slate-700 truncate">{pdf.title}</span>
                                    </div>
                                    <a
                                      href={pdf.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[9.5px] font-bold text-deepskyblue-dark hover:underline hover:text-deepskyblue shrink-0"
                                    >
                                      View
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Inline upload sub-form */}
                          {isUploadingThis && (
                            <form onSubmit={(e) => handleCreateCoursePaper(course.title, e)} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                              <span className="text-[9.5px] font-extrabold text-deepskyblue-dark uppercase block">Upload New PDF to Course</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Document Title</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. DCA Lecture Notes Ch 2"
                                    value={coursePaperForm.title}
                                    onChange={e => setCoursePaperForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="block w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:border-deepskyblue focus:bg-white"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Material Type</label>
                                  <select
                                    value={coursePaperForm.type}
                                    onChange={e => setCoursePaperForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="block w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-[11px] focus:outline-none focus:border-deepskyblue"
                                  >
                                    <option value="book">Study Book / Syllabus Text</option>
                                    <option value="note">Course Note / Handout</option>
                                    <option value="exam_paper">Question Paper / Exam Paper</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3 items-center pt-1">
                                {/* PDF File Picker */}
                                <div className="w-full relative flex-1">
                                  <input
                                    type="file"
                                    required
                                    accept=".pdf"
                                    onChange={handleCoursePdfUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                  />
                                  <button type="button" className="w-full py-1.5 border border-slate-300 border-dashed rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-all">
                                    <Upload className="h-3.5 w-3.5 inline mr-1" />
                                    <span>{uploadingCoursePdf ? "Uploading..." : coursePaperForm.fileUrl ? "PDF Loaded ✓" : "Choose PDF file"}</span>
                                  </button>
                                </div>

                                <button
                                  type="submit"
                                  disabled={uploadingCoursePdf || !coursePaperForm.fileUrl}
                                  className="w-full sm:w-auto py-1.5 px-4 bg-deepskyblue hover:bg-deepskyblue-dark text-white rounded-xl text-[10.5px] font-bold disabled:opacity-50 cursor-pointer transition shadow shadow-deepskyblue/10"
                                >
                                  Save Document PDF
                                </button>
                              </div>
                            </form>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB CONTENT 3: REGISTER STUDENTS ================= */}
          {activeTab === "students" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-md shadow-slate-200/40">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-4 mb-6">
                Direct Candidate Enrollment
              </h3>

              <form onSubmit={handleRegisterStudent} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Candidate Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={studentForm.name}
                      onChange={e => setStudentForm(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={studentForm.dob}
                      onChange={e => setStudentForm(prev => ({ ...prev, dob: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>

                  {/* Father Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Father&apos;s Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Father's Full Name"
                      value={studentForm.fatherName}
                      onChange={e => setStudentForm(prev => ({ ...prev, fatherName: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>

                  {/* Mother Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mother&apos;s Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Mother's Full Name"
                      value={studentForm.motherName}
                      onChange={e => setStudentForm(prev => ({ ...prev, motherName: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={studentForm.phone}
                      onChange={e => setStudentForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="candidate@example.com"
                      value={studentForm.email}
                      onChange={e => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complete Address</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Candidate house, block, state, and pincode details..."
                    value={studentForm.address}
                    onChange={e => setStudentForm(prev => ({ ...prev, address: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Select Course */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Course Program</label>
                    <select
                      required
                      value={studentForm.course}
                      onChange={e => setStudentForm(prev => ({ ...prev, course: e.target.value }))}
                      disabled={courseOptions.length === 0}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all disabled:opacity-60"
                    >
                      <option value="" disabled>
                        {courseOptions.length === 0 ? "No courses created yet. Go to Courses tab to add one." : "Select Enrolled Course"}
                      </option>
                      {courseOptions.map((co, idx) => (
                        <option key={idx} value={co} className="bg-white">{co}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assign Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Portal Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={studentForm.password}
                      onChange={e => setStudentForm(prev => ({ ...prev, password: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>
                </div>

                {/* S3 Document Slots */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attachment Documents (PDF / Image)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Admit Url */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <span className="text-[10px] font-black text-slate-550 block">Admit Card</span>
                      <div className="relative mt-3">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={e => handleFileUpload(e, "admitUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button type="button" className="w-full flex items-center justify-center gap-1.5 py-2 border border-slate-350 border-dashed rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingAdmit ? "Uploading..." : studentForm.admitUrl ? "Ready" : "Browse file"}</span>
                        </button>
                      </div>
                      {studentForm.admitUrl && <p className="text-[9px] text-emerald-600 mt-1 font-semibold truncate">Uploaded to S3</p>}
                    </div>

                    {/* Qualification Url */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <span className="text-[10px] font-black text-slate-550 block">Last Qualification</span>
                      <div className="relative mt-3">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={e => handleFileUpload(e, "qualificationUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button type="button" className="w-full flex items-center justify-center gap-1.5 py-2 border border-slate-350 border-dashed rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingQual ? "Uploading..." : studentForm.qualificationUrl ? "Ready" : "Browse file"}</span>
                        </button>
                      </div>
                      {studentForm.qualificationUrl && <p className="text-[9px] text-emerald-600 mt-1 font-semibold truncate">Uploaded to S3</p>}
                    </div>

                    {/* Extra Url */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                      <span className="text-[10px] font-black text-slate-550 block">Extra Certificate (Optional)</span>
                      <div className="relative mt-3">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={e => handleFileUpload(e, "extraQualificationUrl")}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <button type="button" className="w-full flex items-center justify-center gap-1.5 py-2 border border-slate-350 border-dashed rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                          <Upload className="h-3.5 w-3.5" />
                          <span>{uploadingExtra ? "Uploading..." : studentForm.extraQualificationUrl ? "Ready" : "Browse file"}</span>
                        </button>
                      </div>
                      {studentForm.extraQualificationUrl && <p className="text-[9px] text-emerald-600 mt-1 font-semibold truncate">Uploaded to S3</p>}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingAdmit || uploadingQual || uploadingExtra}
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Enrol Candidate Student</span>
                </button>
              </form>
            </div>
          )}

          {/* ================= TAB CONTENT 4: MANAGE ATTENDANCE ================= */}
          {activeTab === "attendance" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in">
              {/* Log Attendance Form */}
              <form onSubmit={handleLogAttendance} className="md:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Log Student Attendance
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Candidate</label>
                  <select
                    required
                    value={attendanceForm.candidateId}
                    onChange={e => setAttendanceForm(prev => ({ ...prev, candidateId: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  >
                    <option value="" disabled>Select Enrolled Student</option>
                    {studentsList.map((stud, idx) => (
                      <option key={idx} value={stud._id} className="bg-white">
                        {stud.name} ({stud.registrationId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lecture Date</label>
                  <input
                    type="date"
                    required
                    value={attendanceForm.date}
                    onChange={e => setAttendanceForm(prev => ({ ...prev, date: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Status</label>
                  <select
                    value={attendanceForm.status}
                    onChange={e => setAttendanceForm(prev => ({ ...prev, status: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  >
                    <option value="present" className="bg-white">Present</option>
                    <option value="absent" className="bg-white">Absent</option>
                    <option value="leave" className="bg-white">Leave Approved</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <LinkIcon className="h-3 w-3 text-slate-450" />
                    Google Meet Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={attendanceForm.googleMeetLink}
                    onChange={e => setAttendanceForm(prev => ({ ...prev, googleMeetLink: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-xs shadow-md cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Attendance</span>
                </button>
              </form>

              {/* Attendance Sheet Logs */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Attendance History Sheet
                </h3>

                {attendanceList.length === 0 ? (
                  <p className="text-xs text-slate-450 py-8 text-center font-medium">No presence logs logged in database.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                          <th className="pb-3 pl-1">Date</th>
                          <th className="pb-3">Student</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-1">Google Meet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendanceList.map((att, idx) => (
                          <tr key={idx} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 pl-1 font-semibold text-slate-500">{new Date(att.date).toLocaleDateString()}</td>
                            <td className="py-3">
                              <p className="font-bold text-slate-800">{att.candidateId?.name || "N/A"}</p>
                              <span className="text-[9px] text-slate-400 font-mono">{att.candidateId?.registrationId}</span>
                            </td>
                            <td className="py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider ${
                                att.status === "present" ? "bg-emerald-50 text-emerald-600" :
                                att.status === "absent" ? "bg-rose-55 text-rose-600" : "bg-amber-50 text-amber-600"
                              }`}>
                                {att.status}
                              </span>
                            </td>
                            <td className="py-3 text-right pr-1">
                              {att.googleMeetLink ? (
                                <a href={att.googleMeetLink} target="_blank" rel="noreferrer" className="text-deepskyblue-dark hover:text-deepskyblue hover:underline inline-flex items-center gap-0.5 font-bold text-[10px]">
                                  <span>Join class</span>
                                </a>
                              ) : <span className="text-slate-300 font-bold">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB CONTENT 5: QUESTION PAPERS ================= */}
          {activeTab === "papers" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in">
              {/* Upload Paper Form */}
              <form onSubmit={handleCreatePaper} className="md:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Upload Study Material & Exams
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material / Paper Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADIT Study Book or Exam Paper"
                    value={paperForm.title}
                    onChange={e => setPaperForm(prev => ({ ...prev, title: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Course cohort</label>
                  <select
                    required
                    value={paperForm.course}
                    onChange={e => setPaperForm(prev => ({ ...prev, course: e.target.value }))}
                    disabled={courseOptions.length === 0}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {courseOptions.length === 0 ? "No courses created yet. Go to Courses tab to add one." : "Select Target Course"}
                    </option>
                    {courseOptions.map((co, idx) => (
                      <option key={idx} value={co} className="bg-white">{co}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Material Type</label>
                  <select
                    value={paperForm.type || "exam_paper"}
                    onChange={e => setPaperForm(prev => ({ ...prev, type: e.target.value }))}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                  >
                    <option value="exam_paper" className="bg-white">Question Paper / Exam Paper</option>
                    <option value="book" className="bg-white">Study Book / Syllabus Text</option>
                    <option value="note" className="bg-white">Course Note / Handout</option>
                  </select>
                </div>

                {/* S3 File Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attach Document PDF File</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.zip"
                      onChange={e => handleFileUpload(e, "paperUrl")}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <button type="button" className="w-full flex items-center justify-center gap-1.5 py-3 border border-slate-300 border-dashed rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all">
                      <Upload className="h-4 w-4" />
                      <span>{uploadingPaper ? "Uploading to S3..." : paperForm.fileUrl ? "File loaded" : "Browse PDF file"}</span>
                    </button>
                  </div>
                  {paperForm.fileUrl && <p className="text-[9px] text-emerald-600 mt-1 font-semibold truncate">Uploaded to S3</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paper Status</label>
                    <select
                      value={paperForm.status}
                      onChange={e => setPaperForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    >
                      <option value="pending" className="bg-white">Pending</option>
                      <option value="solved" className="bg-white">Solved</option>
                      <option value="locked" className="bg-white">Locked</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Score</label>
                    <input
                      type="text"
                      placeholder="e.g. -- or 85/100"
                      value={paperForm.score}
                      onChange={e => setPaperForm(prev => ({ ...prev, score: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingPaper || !paperForm.fileUrl}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload Study Material</span>
                </button>
              </form>

              {/* List of uploaded papers */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Uploaded Exam Papers History
                </h3>

                {papersList.length === 0 ? (
                  <p className="text-xs text-slate-450 py-8 text-center font-medium">No static syllabus papers uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {papersList.map((paper, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex justify-between items-center">
                        <div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className="text-[9px] font-bold bg-deepskyblue/10 text-deepskyblue-dark px-2 py-0.5 rounded-full uppercase tracking-wider">{paper.course}</span>
                            <span className="text-[9px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {paper.type === "book" ? "Study Book" : paper.type === "note" ? "Class Note" : "Exam Paper"}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 mt-1.5">{paper.title}</h4>
                          <a href={paper.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-deepskyblue-dark hover:text-deepskyblue hover:underline flex items-center gap-0.5 mt-1 font-bold">
                            <span>Open document file</span>
                          </a>
                        </div>

                        <div className="text-right flex flex-col items-end gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider ${
                            paper.status === "solved" ? "bg-emerald-50 text-emerald-600" :
                            paper.status === "pending" ? "bg-deepskyblue/10 text-deepskyblue-dark" : "bg-slate-200 text-slate-500"
                          }`}>
                            {paper.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">Score: {paper.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB CONTENT 6: CREATE QUIZ ================= */}
          {activeTab === "quizzes" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start animate-fade-in">
              {/* Left Column: Create Quiz Form */}
              <form onSubmit={handleCreateQuiz} className="md:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Interactive Exam Builder
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PHP Syntax and Basics Final Exam"
                      value={quizForm.title}
                      onChange={e => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white focus:ring-4 focus:ring-deepskyblue/10 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Target Program</label>
                    <select
                      required
                      value={quizForm.course}
                      onChange={e => {
                        const nextCourse = e.target.value;
                        setQuizForm(prev => ({ ...prev, course: nextCourse, assignedStudents: [] }));
                      }}
                      disabled={courseOptions.length === 0}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white disabled:opacity-60"
                    >
                      <option value="" disabled>
                        {courseOptions.length === 0 ? "No courses created yet. Go to Courses tab to add one." : "Select Target Course"}
                      </option>
                      {courseOptions.map((co, idx) => (
                        <option key={idx} value={co} className="bg-white">{co}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={quizForm.scheduledAt}
                      onChange={e => setQuizForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration (Minutes)</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={quizForm.duration}
                        onChange={e => setQuizForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                        className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Password</label>
                      <input
                        type="text"
                        placeholder="Optional room key"
                        value={quizForm.examPassword}
                        onChange={e => setQuizForm(prev => ({ ...prev, examPassword: e.target.value }))}
                        className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue focus:bg-white"
                      />
                    </div>
                  </div>

                  {quizForm.course && (
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assign Candidates ({quizForm.assignedStudents.length} selected)</label>
                      {studentsList.filter(s => s.course === quizForm.course).length === 0 ? (
                        <p className="text-[10px] text-amber-600 font-bold italic">No candidates enrolled in this course cohort yet.</p>
                      ) : (
                        <div className="max-h-[140px] overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                          {studentsList.filter(s => s.course === quizForm.course).map((student, sIdx) => {
                            const isChecked = quizForm.assignedStudents.includes(student._id);
                            return (
                              <label key={sIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const updated = isChecked
                                      ? quizForm.assignedStudents.filter(id => id !== student._id)
                                      : [...quizForm.assignedStudents, student._id];
                                    setQuizForm(prev => ({ ...prev, assignedStudents: updated }));
                                  }}
                                  className="accent-deepskyblue rounded border-slate-350 cursor-pointer h-3.5 w-3.5"
                                />
                                <span className="truncate">{student.name} ({student.registrationId})</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Questions Array */}
                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">
                      Questions List ({quizForm.questions.length})
                    </h3>
                    
                    <button
                      type="button"
                      onClick={addQuizQuestion}
                      className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-deepskyblue hover:bg-deepskyblue-dark text-[10px] font-bold text-white shadow cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {quizForm.questions.map((question, qIdx) => (
                    <div key={qIdx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 relative">
                      
                      {quizForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuizQuestion(qIdx)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}

                      <span className="text-[10px] uppercase font-black text-deepskyblue-dark">Question #{qIdx + 1}</span>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Question Prompt Text</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Which HTML tag is used for injecting external stylesheets?"
                          value={question.questionText}
                          onChange={e => handleQuizQuestionChange(qIdx, e.target.value)}
                          className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-deepskyblue"
                        />
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((opt, optIdx) => (
                          <div key={optIdx} className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Option {optIdx + 1}</label>
                            <input
                              type="text"
                              required
                              placeholder={`Option ${optIdx + 1} choice`}
                              value={opt}
                              onChange={e => handleQuizOptionChange(qIdx, optIdx, e.target.value)}
                              className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-750 text-xs focus:outline-none focus:border-deepskyblue"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Correct answer Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Correct Choice Index</label>
                          <select
                            value={question.correctAnswerIndex}
                            onChange={e => handleQuizCorrectIndexChange(qIdx, parseInt(e.target.value))}
                            className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-750 text-xs focus:outline-none focus:border-deepskyblue"
                          >
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            <option value={2}>Option 3</option>
                            <option value={3}>Option 4</option>
                          </select>
                        </div>

                        {/* Question Marks Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Question Marks</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={question.marks || 1}
                            onChange={e => handleQuizMarksChange(qIdx, parseInt(e.target.value) || 1)}
                            className="block w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-750 text-xs focus:outline-none focus:border-deepskyblue"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm shadow-md cursor-pointer"
                >
                  <Award className="h-4 w-4" />
                  <span>Build and Assign Exam</span>
                </button>
              </form>

              {/* Right Column: Exams List */}
              <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-3">
                  Created Exams Directory
                </h3>
                {quizzesList.length === 0 ? (
                  <p className="text-xs text-slate-450 py-8 text-center font-medium">No exams created in database yet.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {quizzesList.map((quiz, idx) => {
                      const totalQuizMarks = quiz.questions.reduce((acc: number, q: any) => acc + (q.marks || 1), 0);
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex justify-between items-center">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold bg-deepskyblue/10 text-deepskyblue-dark px-2 py-0.5 rounded-full uppercase tracking-wider">{quiz.course}</span>
                            <h4 className="text-xs font-bold text-slate-800 mt-1">{quiz.title}</h4>
                            <p className="text-[9px] text-slate-400 font-bold mt-1">
                              Scheduled: {quiz.scheduledAt ? new Date(quiz.scheduledAt).toLocaleString() : "Now"}
                              {quiz.duration && ` | Duration: ${quiz.duration} Mins`}
                              {quiz.examPassword && ` | Passkey: ${quiz.examPassword}`}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                              {quiz.questions.length} Questions
                            </span>
                            <span className="text-[10px] font-extrabold text-deepskyblue-dark">
                              Total Marks: {totalQuizMarks}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB CONTENT 7: EXAM RESULTS ================= */}
          {activeTab === "results" && (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-md shadow-slate-200/40 space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Exam Results Registry</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Master ledger of completed student examinations</p>
                </div>
              </div>

              {resultsList.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center font-medium">No exam results recorded in the database yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                        <th className="pb-3 pl-2">Student Name</th>
                        <th className="pb-3">Reg ID</th>
                        <th className="pb-3">Course Cohort</th>
                        <th className="pb-3">Exam Title</th>
                        <th className="pb-3 text-center">Score</th>
                        <th className="pb-3 text-center">Percentage</th>
                        <th className="pb-3 text-center">Grade</th>
                        <th className="pb-3">Date Taken</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {resultsList
                        .filter(res => {
                          const query = searchQuery.toLowerCase();
                          const studentName = res.candidateId?.name?.toLowerCase() || "";
                          const regId = res.candidateId?.registrationId?.toLowerCase() || "";
                          const course = res.candidateId?.course?.toLowerCase() || "";
                          const examTitle = res.quizTitle?.toLowerCase() || "";
                          return studentName.includes(query) || regId.includes(query) || course.includes(query) || examTitle.includes(query);
                        })
                        .map((res, idx) => (
                          <tr key={idx} className="text-slate-700 hover:bg-slate-50/50 hover:text-slate-900 transition-colors">
                            <td className="py-3.5 pl-2 font-semibold">
                              {res.candidateId?.name || "Deleted Candidate"}
                            </td>
                            <td className="py-3.5 font-bold text-deepskyblue-dark">
                              {res.candidateId?.registrationId || "N/A"}
                            </td>
                            <td className="py-3.5 text-slate-500 font-medium">
                              {res.candidateId?.course || "N/A"}
                            </td>
                            <td className="py-3.5 font-semibold text-slate-800">
                              {res.quizTitle}
                            </td>
                            <td className="py-3.5 text-center font-bold text-slate-700">
                              {res.score} / {res.total}
                            </td>
                            <td className="py-3.5 text-center font-extrabold text-slate-900">
                              {res.percentage}%
                            </td>
                            <td className="py-3.5 text-center font-black text-deepskyblue-dark">
                              {res.grade}
                            </td>
                            <td className="py-3.5 text-slate-400 font-medium">
                              {new Date(res.date).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 text-right pr-2 space-x-2">
                              <button
                                onClick={() => triggerPrint("marksheet", res)}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-600 transition cursor-pointer"
                              >
                                Marksheet
                              </button>
                              <button
                                onClick={() => triggerPrint("certificate", res)}
                                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-[10px] font-bold text-white shadow shadow-amber-500/10 transition cursor-pointer"
                              >
                                Certificate
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* STUDENT DETAILS LOOKUP OVERLAY MODAL */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white border border-slate-250 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-left">
            <div className="flex justify-between items-start border-b border-slate-150 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">Student Details Lookup</h3>
                {studentDetails?.student && (
                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    Name: {studentDetails.student.name} ({studentDetails.student.registrationId})
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedStudentId(null);
                  setStudentDetails(null);
                }}
                className="text-slate-655 hover:text-slate-950 text-xs font-bold bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>

            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="h-10 w-10 border-4 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fetching Student Profile Data...</p>
              </div>
            ) : studentDetails ? (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                  <button
                    onClick={() => setModalActiveTab("profile")}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      modalActiveTab === "profile"
                        ? "border-deepskyblue text-deepskyblue-dark font-black"
                        : "border-transparent text-slate-450 hover:text-slate-700"
                    }`}
                  >
                    Profile Info
                  </button>
                  <button
                    onClick={() => setModalActiveTab("attendance")}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      modalActiveTab === "attendance"
                        ? "border-deepskyblue text-deepskyblue-dark font-black"
                        : "border-transparent text-slate-450 hover:text-slate-700"
                    }`}
                  >
                    Attendance Sheet ({studentDetails.attendance?.length || 0})
                  </button>
                  <button
                    onClick={() => setModalActiveTab("results")}
                    className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      modalActiveTab === "results"
                        ? "border-deepskyblue text-deepskyblue-dark font-black"
                        : "border-transparent text-slate-450 hover:text-slate-700"
                    }`}
                  >
                    Quiz Results ({studentDetails.results?.length || 0})
                  </button>
                </div>

                {/* Tab content 1: Profile Info */}
                {modalActiveTab === "profile" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs text-slate-700">
                    <div className="py-2.5 border-b border-slate-100 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Father&apos;s Name</span>
                      <span className="font-semibold text-slate-800">{studentDetails.student.fatherName}</span>
                    </div>
                    <div className="py-2.5 border-b border-slate-100 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mother&apos;s Name</span>
                      <span className="font-semibold text-slate-800">{studentDetails.student.motherName}</span>
                    </div>
                    <div className="py-2.5 border-b border-slate-100 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Date of Birth</span>
                      <span className="font-semibold text-slate-800">{new Date(studentDetails.student.dob).toLocaleDateString()}</span>
                    </div>
                    <div className="py-2.5 border-b border-slate-100 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email ID</span>
                      <span className="font-semibold text-slate-800">{studentDetails.student.email}</span>
                    </div>
                    <div className="py-2.5 border-b border-slate-100 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</span>
                      <span className="font-semibold text-slate-800">{studentDetails.student.phone}</span>
                    </div>
                    <div className="py-2.5 border-b border-slate-100 flex justify-between">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Enrolled Course</span>
                      <span className="font-semibold text-deepskyblue-dark">{studentDetails.student.course}</span>
                    </div>
                    <div className="py-2.5 border-b border-slate-100 sm:col-span-2 flex flex-col gap-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Address</span>
                      <span className="text-slate-600 font-medium break-words leading-relaxed">{studentDetails.student.address}</span>
                    </div>
                    <div className="sm:col-span-2 space-y-2 pt-2">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Uploaded Documents (S3 Links)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {studentDetails.student.admitUrl && (
                          <a href={studentDetails.student.admitUrl} target="_blank" rel="noreferrer" className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-655 hover:bg-slate-100 transition">
                            <span>Admit Card</span>
                            <span className="text-deepskyblue-dark font-black hover:underline">Open link</span>
                          </a>
                        )}
                        {studentDetails.student.qualificationUrl && (
                          <a href={studentDetails.student.qualificationUrl} target="_blank" rel="noreferrer" className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-655 hover:bg-slate-100 transition">
                            <span>Last Qualification</span>
                            <span className="text-deepskyblue-dark font-black hover:underline">Open link</span>
                          </a>
                        )}
                        {studentDetails.student.extraQualificationUrl && (
                          <a href={studentDetails.student.extraQualificationUrl} target="_blank" rel="noreferrer" className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-bold text-slate-655 hover:bg-slate-100 transition">
                            <span>Extra Certificate</span>
                            <span className="text-deepskyblue-dark font-black hover:underline">Open link</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab content 2: Attendance */}
                {modalActiveTab === "attendance" && (
                  <div className="space-y-4">
                    {/* Attendance summary statistics */}
                    {(() => {
                      const total = studentDetails.attendance?.length || 0;
                      const present = studentDetails.attendance?.filter((a: any) => a.status === "present").length || 0;
                      const absent = studentDetails.attendance?.filter((a: any) => a.status === "absent").length || 0;
                      const leave = studentDetails.attendance?.filter((a: any) => a.status === "leave").length || 0;
                      const percent = total > 0 ? ((present / total) * 100).toFixed(1) : "100.0";
                      
                      return (
                        <div className="grid grid-cols-4 gap-4 text-center bg-slate-50 p-4 border border-slate-200/80 rounded-2xl">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Attendance Rate</span>
                            <span className="text-lg font-black text-deepskyblue-dark mt-1 block">{percent}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Present</span>
                            <span className="text-lg font-black text-emerald-600 mt-1 block">{present} Lectures</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Absent</span>
                            <span className="text-lg font-black text-rose-500 mt-1 block">{absent} Lectures</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Leave</span>
                            <span className="text-lg font-black text-amber-500 mt-1 block">{leave} Sessions</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Attendance List */}
                    {studentDetails.attendance?.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10">No attendance history logs recorded for this student.</p>
                    ) : (
                      <div className="max-h-[30vh] overflow-y-auto pr-1">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9px] font-bold">
                              <th className="pb-2">Date</th>
                              <th className="pb-2">Attendance Status</th>
                              <th className="pb-2 text-right">Google Meet Cohort Link</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {studentDetails.attendance.map((att: any, idx: number) => (
                              <tr key={idx} className="text-slate-700">
                                <td className="py-2.5 font-semibold text-slate-500">{new Date(att.date).toLocaleDateString()}</td>
                                <td className="py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-wider ${
                                    att.status === "present" ? "bg-emerald-50 text-emerald-600" :
                                    att.status === "absent" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                                  }`}>
                                    {att.status}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-semibold">
                                  {att.googleMeetLink ? (
                                    <a href={att.googleMeetLink} target="_blank" rel="noreferrer" className="text-deepskyblue-dark hover:underline hover:text-deepskyblue font-bold text-[10px]">
                                      Open Meet Link
                                    </a>
                                  ) : <span className="text-slate-300">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab content 3: Quiz Results */}
                {modalActiveTab === "results" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-200/80 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Academic Records Statement</h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Generate cumulative grades card for the student</p>
                      </div>
                      <button
                        onClick={() => triggerPrint("cumulative_marksheet", studentDetails.results)}
                        className="flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 font-bold text-white text-[10px] cursor-pointer shadow transition"
                      >
                        <Printer className="h-3.5 w-3.5 mr-1" />
                        <span>Print Cumulative Marksheet</span>
                      </button>
                    </div>

                    {studentDetails.results?.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10">No quizzes or interactive evaluations completed by this student.</p>
                    ) : (
                      <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                        {studentDetails.results.map((res: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{res.quizTitle}</h4>
                              <p className="text-[9px] text-slate-450 font-semibold mt-1">Completed on: {new Date(res.date).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-2">
                                <span className="text-[9px] text-slate-400 block font-semibold">Marks Gained</span>
                                <span className="text-xs text-emerald-650 font-bold">
                                  {res.score}/{res.total} ({res.grade})
                                </span>
                              </div>
                              <button
                                onClick={() => triggerPrint("marksheet", res)}
                                className="py-1.5 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[10px] font-bold text-slate-600 transition cursor-pointer"
                              >
                                Marksheet
                              </button>
                              <button
                                onClick={() => triggerPrint("certificate", res)}
                                className="py-1.5 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-[10px] font-bold text-white shadow shadow-amber-500/10 transition cursor-pointer"
                              >
                                Certificate
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-10 font-semibold">Error rendering student data.</p>
            )}
          </div>
        </div>
      )}

      {/* PRINT AREA CONTAINER (Hidden on screen, shown in printing) */}
      <div id="print-area-wrapper" className="hidden print:block">
        {printTarget?.type === "marksheet" && renderPrintMarksheet(printTarget.data)}
        {printTarget?.type === "cumulative_marksheet" && renderPrintCumulativeMarksheet(printTarget.data)}
        {printTarget?.type === "certificate" && renderPrintCertificate(printTarget.data)}
      </div>

    </div>
  );
}
