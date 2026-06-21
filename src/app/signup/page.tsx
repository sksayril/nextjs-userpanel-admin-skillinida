"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  User,
  Users,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  ShieldCheck,
  Printer,
  Sparkles,
  Download,
  Upload
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
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
    otp: "",
    password: "",
    agentCode: "",
    profilePicUrl: "",
  });

  // Upload progress and loading states
  const [uploadingAdmit, setUploadingAdmit] = useState(false);
  const [uploadingQual, setUploadingQual] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [admitFileName, setAdmitFileName] = useState("");
  const [qualFileName, setQualFileName] = useState("");
  const [extraFileName, setExtraFileName] = useState("");
  const [profileFileName, setProfileFileName] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Registered candidate object returned from server
  const [registeredCandidate, setRegisteredCandidate] = useState<any>(null);

  const [coursesList, setCoursesList] = useState<any[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses");
        const data = await res.json();
        if (res.ok && data.success) {
          setCoursesList(data.courses || []);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Handle textual changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    setErrorMsg("");
  };

  // Handle S3 uploads
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "admitUrl" | "qualificationUrl" | "extraQualificationUrl" | "profilePicUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === "admitUrl") {
      setUploadingAdmit(true);
      setAdmitFileName(file.name);
    } else if (field === "qualificationUrl") {
      setUploadingQual(true);
      setQualFileName(file.name);
    } else if (field === "profilePicUrl") {
      setUploadingProfile(true);
      setProfileFileName(file.name);
    } else {
      setUploadingExtra(true);
      setExtraFileName(file.name);
    }

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (res.ok && result.url) {
        setFormData((prev) => ({ ...prev, [field]: result.url }));
        toast.success("Document uploaded successfully.");
      } else {
        toast.error(result.error || "File upload failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error uploading file.");
    } finally {
      if (field === "admitUrl") setUploadingAdmit(false);
      else if (field === "qualificationUrl") setUploadingQual(false);
      else if (field === "profilePicUrl") setUploadingProfile(false);
      else setUploadingExtra(false);
    }
  };

  // Send email verification OTP
  const handleSendOtp = async () => {
    if (!formData.email) {
      setErrorMsg("Email address is required to send verification code");
      return;
    }
    setOtpLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await res.json();
      if (res.ok) {
        setOtpSent(true);
        // Display notice about fallback log printing
        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.error || "Failed to dispatch verification code");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error sending verification code");
    } finally {
      setOtpLoading(false);
    }
  };

  // Register Candidate
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp) {
      setErrorMsg("OTP Code is required for registration verification");
      return;
    }
    setSubmitLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setRegisteredCandidate(result.candidate);
        setStep(4);
      } else {
        setErrorMsg(result.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error registering candidate");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Step Navigations
  const nextStep = () => {
    if (step === 1) {
      if (
        !formData.name ||
        !formData.fatherName ||
        !formData.motherName ||
        !formData.dob ||
        !formData.phone ||
        !formData.address
      ) {
        setErrorMsg("Please fill in all personal details fields");
        return;
      }
    }
    if (step === 2) {
      if (!formData.course || !formData.admitUrl || !formData.qualificationUrl || !formData.profilePicUrl) {
        setErrorMsg("Interested course, Admin/Intermediate Admit Card, Profile photo, and Qualification certificate are required");
        return;
      }
    }
    setErrorMsg("");
    setStep(step + 1);
  };

  const prevStep = () => {
    setErrorMsg("");
    setStep(step - 1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 overflow-hidden font-sans select-none py-12 px-4 sm:px-6">
      
      {/* Background Glowing Ambient Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden print:hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-deepskyblue/10 blur-[100px] top-[-50px] left-[-50px] animate-drift-slow" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-deepskyblue-dark/5 blur-[120px] bottom-[-100px] right-[-100px] animate-drift-slower" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-sky-400/8 blur-[90px] top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 animate-drift-slowest" />
      </div>

      {/* CSS style block for print layouts */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #id-card-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-2xl">
        
        {/* Progress Step Header (Hidden when printing ID Card) */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-8 px-4 print:hidden">
            <div className="flex items-center gap-3">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${step >= 1 ? "bg-deepskyblue border-deepskyblue text-white shadow-sm shadow-deepskyblue/20" : "border-slate-300 text-slate-400"}`}>1</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Details</span>
            </div>
            <div className="flex-1 h-[2px] bg-slate-200 mx-4" />
            <div className="flex items-center gap-3">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${step >= 2 ? "bg-deepskyblue border-deepskyblue text-white shadow-sm shadow-deepskyblue/20" : "border-slate-300 text-slate-400"}`}>2</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Documents</span>
            </div>
            <div className="flex-1 h-[2px] bg-slate-200 mx-4" />
            <div className="flex items-center gap-3">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${step >= 3 ? "bg-deepskyblue border-deepskyblue text-white shadow-sm shadow-deepskyblue/20" : "border-slate-300 text-slate-400"}`}>3</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Verify</span>
            </div>
          </div>
        )}

        <div className={`backdrop-blur-xl bg-white/95 border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/40 transition-all duration-300 ${step === 4 ? "p-4 sm:p-6" : "p-8 sm:p-10"} print:border-none print:shadow-none print:bg-transparent`}>
          
          {/* Header Title Section (Hidden when printing) */}
          {step < 4 && (
            <div className="flex flex-col items-center mb-8 text-center print:hidden">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/25 mb-4 animate-pulse">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 bg-gradient-to-r from-slate-900 via-deepskyblue-dark to-sky-600 bg-clip-text text-transparent">
                Candidate Registration
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Support Mission India â€” Fill in steps to register your candidate profile
              </p>
            </div>
          )}

          {/* Validation Messages (Hidden when printing) */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold print:hidden">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-sm font-semibold print:hidden">
              {successMsg}
            </div>
          )}

          {/* STEP 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-5 print:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      id="name"
                      suppressHydrationWarning
                      type="text"
                      placeholder="Candidate's Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>
                </div>

                {/* DOB */}
                <div className="space-y-1.5">
                  <label htmlFor="dob" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </span>
                    <input
                      id="dob"
                      suppressHydrationWarning
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>
                </div>

                {/* Father's Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fatherName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Father&apos;s Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Users className="h-4 w-4" />
                    </span>
                    <input
                      id="fatherName"
                      suppressHydrationWarning
                      type="text"
                      placeholder="Father's Full Name"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>
                </div>

                {/* Mother's Name */}
                <div className="space-y-1.5">
                  <label htmlFor="motherName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Mother&apos;s Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Users className="h-4 w-4" />
                    </span>
                    <input
                      id="motherName"
                      suppressHydrationWarning
                      type="text"
                      placeholder="Mother's Full Name"
                      value={formData.motherName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    id="phone"
                      suppressHydrationWarning
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label htmlFor="address" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Complete Address
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <textarea
                    id="address"
                      suppressHydrationWarning
                    rows={3}
                    placeholder="Enter permanent house, block, state, and pincode details"
                    value={formData.address}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10 resize-none"
                  />
                </div>
              </div>

              {/* Navigation Action */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-deepskyblue">
                  Already have ID card? Sign In
                </Link>
                <button
                  type="button"
                      suppressHydrationWarning
                  onClick={nextStep}
                  className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-deepskyblue hover:bg-deepskyblue-dark font-bold text-white text-sm shadow-md shadow-deepskyblue/15 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Course & File Uploads */}
          {step === 2 && (
            <div className="space-y-5 print:hidden">
              {/* Interested Course */}
              <div className="space-y-1.5">
                <label htmlFor="course" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Interested Course
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <select
                    id="course"
                      suppressHydrationWarning
                    value={formData.course}
                    onChange={handleChange}
                    disabled={coursesList.length === 0}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {coursesList.length === 0 ? "No course programs available at the moment" : "Select a course program"}
                    </option>
                    {coursesList.map((courseOption, index) => (
                      <option key={index} value={courseOption.title} className="bg-white text-slate-850">
                        {courseOption.title} ({courseOption.code}) — {courseOption.isPaid ? `Paid (₹${courseOption.price})` : "Free"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agent Referral Code */}
              <div className="space-y-1.5">
                <label htmlFor="agentCode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Agent Referral Code (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="agentCode"
                      suppressHydrationWarning
                    type="text"
                    placeholder="Enter Agent referral code if you have one"
                    value={formData.agentCode}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                  />
                </div>
              </div>

              {/* File Upload fields */}
              <div className="space-y-6 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-deepskyblue-dark border-b border-slate-100 pb-2">
                  Document Attachments
                </h3>

                {/* Profile Photo Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Profile Picture <span className="text-rose-500">*</span>
                    </label>
                    {formData.profilePicUrl && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    )}
                  </div>
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${
                    formData.profilePicUrl 
                      ? "bg-emerald-50/20 border-emerald-500/40 hover:bg-emerald-50/35" 
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-deepskyblue-light/10 hover:border-deepskyblue"
                  }`}>
                    <input
                      type="file"
                      id="profile-pic-file"
                      suppressHydrationWarning
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "profilePicUrl")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    
                    {uploadingProfile ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 border-3 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-deepskyblue-dark animate-pulse">Uploading Photo...</span>
                      </div>
                    ) : formData.profilePicUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                          <img src={formData.profilePicUrl} className="h-full w-full object-cover" alt="Profile Preview" />
                        </div>
                        <div className="max-w-full px-2">
                          <p className="text-xs font-bold text-slate-700 break-all">{profileFileName || "profile_picture"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Click or drag to replace photo</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-deepskyblue-light/50 flex items-center justify-center text-deepskyblue-dark">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Select Profile Picture</p>
                          <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admit Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Admin/Intermediate Admit Card <span className="text-rose-500">*</span>
                    </label>
                    {formData.admitUrl && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    )}
                  </div>
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${
                    formData.admitUrl 
                      ? "bg-emerald-50/20 border-emerald-500/40 hover:bg-emerald-50/35" 
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-deepskyblue-light/10 hover:border-deepskyblue"
                  }`}>
                    <input
                      type="file"
                      id="admit-file"
                      suppressHydrationWarning
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "admitUrl")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    
                    {uploadingAdmit ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 border-3 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-deepskyblue-dark animate-pulse">Uploading Document...</span>
                      </div>
                    ) : formData.admitUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="max-w-full px-2">
                          <p className="text-xs font-bold text-slate-700 break-all">{admitFileName || "admit_card_document"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Click or drag to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-deepskyblue-light/50 flex items-center justify-center text-deepskyblue-dark">
                          <Upload className="h-5 w-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Select Admin/Intermediate Admit Card Document</p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Qualification certificate upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Last Qualification Certificate <span className="text-rose-500">*</span>
                    </label>
                    {formData.qualificationUrl && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    )}
                  </div>
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${
                    formData.qualificationUrl 
                      ? "bg-emerald-50/20 border-emerald-500/40 hover:bg-emerald-50/35" 
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-deepskyblue-light/10 hover:border-deepskyblue"
                  }`}>
                    <input
                      type="file"
                      id="qual-file"
                      suppressHydrationWarning
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "qualificationUrl")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    
                    {uploadingQual ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 border-3 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-deepskyblue-dark animate-pulse">Uploading Document...</span>
                      </div>
                    ) : formData.qualificationUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="max-w-full px-2">
                          <p className="text-xs font-bold text-slate-700 break-all">{qualFileName || "qualification_document"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Click or drag to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-deepskyblue-light/50 flex items-center justify-center text-deepskyblue-dark">
                          <Upload className="h-5 w-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Select Qualification Document</p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extra Qualification Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Extra Qualification Certificate (Optional)
                    </label>
                    {formData.extraQualificationUrl && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    )}
                  </div>
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${
                    formData.extraQualificationUrl 
                      ? "bg-emerald-50/20 border-emerald-500/40 hover:bg-emerald-50/35" 
                      : "bg-slate-50/60 border-slate-200/80 hover:bg-deepskyblue-light/10 hover:border-deepskyblue"
                  }`}>
                    <input
                      type="file"
                      id="extra-file"
                      suppressHydrationWarning
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "extraQualificationUrl")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    
                    {uploadingExtra ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 border-3 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-deepskyblue-dark animate-pulse">Uploading Document...</span>
                      </div>
                    ) : formData.extraQualificationUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="max-w-full px-2">
                          <p className="text-xs font-bold text-slate-700 break-all">{extraFileName || "extra_qualification_document"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Click or drag to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-deepskyblue-light/50 flex items-center justify-center text-deepskyblue-dark">
                          <Upload className="h-5 w-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Select Extra Document (Optional)</p>
                          <p className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Action */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <button
                  type="button"
                      suppressHydrationWarning
                  onClick={prevStep}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                      suppressHydrationWarning
                  onClick={nextStep}
                  className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-deepskyblue hover:bg-deepskyblue-dark font-bold text-white text-sm shadow-md shadow-deepskyblue/15 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OTP Mail Verification */}
          {step === 3 && (
            <div className="space-y-6 print:hidden">
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-deepskyblue flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Email Verification OTP</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      We require email validation to secure registration. Click Send Code to receive a 6-digit OTP code on your mail.
                    </p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 pt-2">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Candidate Email Address
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        id="email"
                      suppressHydrationWarning
                        type="email"
                        required
                        placeholder="candidate@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                      />
                    </div>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleSendOtp}
                      disabled={otpLoading || !formData.email}
                      className="py-2.5 px-4 rounded-xl bg-deepskyblue/10 hover:bg-deepskyblue/25 text-deepskyblue-dark border border-deepskyblue/20 font-bold text-sm transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"
                    >
                      {otpLoading ? "Sending..." : otpSent ? "Resend" : "Send Code"}
                    </button>
                  </div>
                </div>
              </div>

              {otpSent && (
                <form onSubmit={handleRegister} className="space-y-5">
                  {/* OTP Verification code */}
                  <div className="space-y-1.5">
                    <label htmlFor="otp" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Enter Verification Code (OTP)
                    </label>
                    <input
                      id="otp"
                      suppressHydrationWarning
                      type="text"
                      required
                      placeholder="Enter 6-digit OTP"
                      value={formData.otp}
                      onChange={handleChange}
                      maxLength={6}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-lg font-bold text-center tracking-widest focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>

                  {/* Choose Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Choose Password
                    </label>
                    <input
                      id="password"
                      suppressHydrationWarning
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                      suppressHydrationWarning
                    disabled={submitLoading || !formData.otp}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm transition-all duration-200 shadow-md shadow-deepskyblue/15 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitLoading ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Register Candidate</span>
                        <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Navigation Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                      suppressHydrationWarning
                  onClick={prevStep}
                  className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Registration ID Card */}
          {step === 4 && registeredCandidate && (
            <div className="flex flex-col items-center">
              
              {/* Success Info (Hidden when printing ID Card) */}
              <div className="flex flex-col items-center text-center mb-8 print:hidden">
                <div className="h-16 w-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-4 text-emerald-600">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Registration Successful!</h2>
                <p className="text-slate-500 text-sm mt-1 max-w-sm">
                  Candidate has been registered in our database. Your printable registration ID card is generated below.
                </p>
              </div>

              {/* Printable ID Card */}
              <div
                id="id-card-print-area"
                className="w-full max-w-lg bg-white border border-slate-250 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-left bg-gradient-to-br from-white via-slate-50/50 to-deepskyblue-light/20"
              >
                {/* ID Card Background Glow */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <div className="absolute w-64 h-64 rounded-full bg-deepskyblue/8 blur-[80px] -top-20 -left-20" />
                  <div className="absolute w-64 h-64 rounded-full bg-deepskyblue-dark/4 blur-[80px] -bottom-20 -right-20" />
                </div>

                {/* Card Header */}
                <div className="flex justify-between items-start border-b border-slate-200/80 pb-4 mb-5 relative z-10">
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-deepskyblue flex items-center justify-center text-xs font-black tracking-wider text-white">S</div>
                      SUPPORT MISSION INDIA
                    </h3>
                    <p className="text-[10px] uppercase font-bold text-deepskyblue-dark tracking-widest mt-0.5">
                      Candidate Registration ID Card
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold bg-deepskyblue/10 text-deepskyblue-dark border border-deepskyblue/20 px-2 py-0.5 rounded-full">
                      Active Student
                    </span>
                  </div>
                </div>

                {/* Card Details */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 relative z-10">
                  {/* Photo Box */}
                  <div className="sm:col-span-3 flex flex-col items-center sm:items-start">
                    <div className="h-24 w-20 bg-slate-100 border border-slate-250 rounded-xl overflow-hidden flex flex-col items-center justify-center text-slate-400 shadow-inner bg-gradient-to-b from-white to-slate-50">
                      {registeredCandidate.profilePicUrl ? (
                        <img src={registeredCandidate.profilePicUrl} className="h-full w-full object-cover" alt="Student Photo" />
                      ) : (
                        <>
                          <span className="text-2xl font-black text-slate-500 uppercase">
                            {registeredCandidate.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </span>
                          <span className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Candidate</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="sm:col-span-9 space-y-2.5 text-xs text-slate-600">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Registration ID</span>
                      <span className="col-span-2 font-bold text-slate-900 tracking-wide">{registeredCandidate.registrationId}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Candidate Name</span>
                      <span className="col-span-2 font-bold text-slate-800">{registeredCandidate.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Father&apos;s Name</span>
                      <span className="col-span-2 text-slate-700 font-medium">{registeredCandidate.fatherName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Mother&apos;s Name</span>
                      <span className="col-span-2 text-slate-700 font-medium">{registeredCandidate.motherName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Date of Birth</span>
                      <span className="col-span-2 text-slate-700 font-medium">{new Date(registeredCandidate.dob).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Course Program</span>
                      <span className="col-span-2 text-deepskyblue-dark font-bold">{registeredCandidate.course}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Phone Number</span>
                      <span className="col-span-2 text-slate-700 font-medium">{registeredCandidate.phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold">Email Mail ID</span>
                      <span className="col-span-2 text-slate-700 font-medium truncate">{registeredCandidate.email}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-400 font-semibold flex-shrink-0">Address</span>
                      <span className="col-span-2 text-slate-500 font-medium break-words line-clamp-2">{registeredCandidate.address}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Verification */}
                <div className="mt-6 border-t border-slate-200/80 pt-4 flex justify-between items-center relative z-10 text-[9px] text-slate-400">
                  <div>
                    <p>Issued: {new Date(registeredCandidate.createdAt).toLocaleString()}</p>
                    <p className="mt-0.5 text-slate-500 font-medium">Website: supportmissionindia.org</p>
                  </div>
                  {/* Barcode Mockup */}
                  <div className="flex flex-col items-end">
                    <svg className="h-6 w-32 text-slate-650" viewBox="0 0 100 20" fill="currentColor">
                      <rect x="0" y="0" width="2" height="20" />
                      <rect x="3" y="0" width="1" height="20" />
                      <rect x="5" y="0" width="4" height="20" />
                      <rect x="10" y="0" width="1" height="20" />
                      <rect x="12" y="0" width="2" height="20" />
                      <rect x="15" y="0" width="3" height="20" />
                      <rect x="19" y="0" width="1" height="20" />
                      <rect x="21" y="0" width="2" height="20" />
                      <rect x="24" y="0" width="4" height="20" />
                      <rect x="29" y="0" width="1" height="20" />
                      <rect x="31" y="0" width="2" height="20" />
                      <rect x="34" y="0" width="1" height="20" />
                      <rect x="36" y="0" width="3" height="20" />
                      <rect x="40" y="0" width="1" height="20" />
                      <rect x="42" y="0" width="4" height="20" />
                      <rect x="47" y="0" width="2" height="20" />
                      <rect x="50" y="0" width="1" height="20" />
                      <rect x="52" y="0" width="3" height="20" />
                      <rect x="56" y="0" width="2" height="20" />
                      <rect x="59" y="0" width="1" height="20" />
                      <rect x="61" y="0" width="4" height="20" />
                      <rect x="66" y="0" width="1" height="20" />
                      <rect x="68" y="0" width="2" height="20" />
                      <rect x="71" y="0" width="3" height="20" />
                      <rect x="75" y="0" width="1" height="20" />
                      <rect x="77" y="0" width="4" height="20" />
                      <rect x="82" y="0" width="2" height="20" />
                      <rect x="85" y="0" width="1" height="20" />
                      <rect x="87" y="0" width="3" height="20" />
                      <rect x="91" y="0" width="1" height="20" />
                      <rect x="93" y="0" width="4" height="20" />
                      <rect x="98" y="0" width="2" height="20" />
                    </svg>
                    <span className="text-[7px] tracking-widest mt-0.5 font-mono">
                      {registeredCandidate.registrationId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Printing & Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 print:hidden w-full justify-center">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-250 font-bold text-slate-700 text-sm shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print ID Card</span>
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm shadow-md shadow-deepskyblue/15 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    // Reset registration state
                    setStep(1);
                    setFormData({
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
                      otp: "",
                      password: "",
                      agentCode: "",
                      profilePicUrl: "",
                    });
                    setOtpSent(false);
                    setRegisteredCandidate(null);
                    setSuccessMsg("");
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold text-sm transition-all cursor-pointer"
                >
                  <span>New Registration</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
