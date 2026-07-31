"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { resolveFileUrl } from "@/lib/fileUrl";
import {
  RegistrationIdCard,
  printRegistrationIdCard,
} from "@/components/RegistrationIdCard";
import { registrationIdCardPrintStyles } from "@/components/registrationIdCardPrintStyles";
import { WEST_BENGAL_DISTRICTS } from "@/lib/westBengalDistricts";
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
  Printer,
  Sparkles,
  Download,
  Upload,
  Lock
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
    category: "GEN",
    gender: "MALE",
    email: "",
    phone: "",
    district: "",
    address: "",
    course: "",
    admitUrl: "",
    qualificationUrl: "",
    extraQualificationUrl: "",
    signatureUrl: "",
    password: "",
    agentCode: "",
    profilePicUrl: "",
    pincode: "",
    state: "",
  });

  // Upload progress and loading states
  const [uploadingAdmit, setUploadingAdmit] = useState(false);
  const [uploadingQual, setUploadingQual] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [admitFileName, setAdmitFileName] = useState("");
  const [qualFileName, setQualFileName] = useState("");
  const [extraFileName, setExtraFileName] = useState("");
  const [profileFileName, setProfileFileName] = useState("");
  const [signatureFileName, setSignatureFileName] = useState("");

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
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: id === "agentCode" ? value.toUpperCase() : value,
    }));
    setErrorMsg("");
  };

  // Handle S3 uploads
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "admitUrl" | "qualificationUrl" | "extraQualificationUrl" | "profilePicUrl" | "signatureUrl"
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
    } else if (field === "signatureUrl") {
      setUploadingSignature(true);
      setSignatureFileName(file.name);
    } else {
      setUploadingExtra(true);
      setExtraFileName(file.name);
    }

    const uploadFolderMap = {
      profilePicUrl: "profile",
      admitUrl: "documents",
      qualificationUrl: "documents",
      extraQualificationUrl: "documents",
      signatureUrl: "signature",
    } as const;

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", uploadFolderMap[field]);

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
      else if (field === "signatureUrl") setUploadingSignature(false);
      else setUploadingExtra(false);
    }
  };

  const [pincodeLoading, setPincodeLoading] = useState(false);

  const handlePincodeLookup = async (pin: string) => {
    if (pin.length !== 6) return;
    setPincodeLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/pincode?pin=${pin}`);
      const data = await res.json();
      if (data && data[0] && data[0].Status === "Success") {
        const postOfficeList = data[0].PostOffice;
        if (postOfficeList && postOfficeList.length > 0) {
          const first = postOfficeList[0];
          const apiDistrict = first.District;
          const apiState = first.State;

          setFormData((prev) => ({
            ...prev,
            district: apiDistrict || "",
            state: apiState || "",
          }));

          setSuccessMsg(`PIN Code verified for ${apiDistrict}, ${apiState}.`);
        } else {
          setErrorMsg("No post office records found for this PIN Code.");
        }
      } else {
        setErrorMsg("Invalid PIN Code or details not found.");
      }
    } catch (err) {
      console.error("PIN Code error:", err);
      setErrorMsg("Failed to verify PIN Code. Please enter details manually.");
    } finally {
      setPincodeLoading(false);
    }
  };

  // Register Candidate
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setErrorMsg("Email address is required");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
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
        !formData.category ||
        !formData.gender ||
        !formData.phone ||
        !formData.district ||
        !formData.pincode ||
        !formData.state ||
        !formData.address
      ) {
        setErrorMsg("Please fill in all personal details fields");
        return;
      }
      const cleanPhone = formData.phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        setErrorMsg("Phone number must be exactly 10 digits");
        return;
      }
    }
    if (step === 2) {
      if (!formData.course || !formData.admitUrl || !formData.qualificationUrl || !formData.profilePicUrl || !formData.signatureUrl) {
        setErrorMsg("Interested course, Admit Card, Profile photo, Qualification certificate, and Candidate Signature are required");
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
    printRegistrationIdCard();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 overflow-hidden font-sans select-none py-12 px-4 sm:px-6">

      {/* Background Glowing Ambient Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden print:hidden">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-deepskyblue/10 blur-[100px] top-[-50px] left-[-50px] animate-drift-slow" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-deepskyblue-dark/5 blur-[120px] bottom-[-100px] right-[-100px] animate-drift-slower" />
        <div className="absolute w-[350px] h-[350px] rounded-full bg-sky-400/8 blur-[90px] top-1/2 left-1/3 -translate-y-1/2 -translate-x-1/2 animate-drift-slowest" />
      </div>

      <style jsx global>{registrationIdCardPrintStyles}</style>

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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 hidden sm:inline">Account</span>
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

                {/* Category selection */}
                <div className="space-y-1.5">
                  <label htmlFor="category" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Social Category
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Users className="h-4 w-4" />
                    </span>
                    <select
                      id="category"
                      suppressHydrationWarning
                      value={formData.category}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    >
                      <option value="GEN">GEN (General)</option>
                      <option value="OBC">OBC (Other Backward Classes)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                    </select>
                  </div>
                </div>

                {/* Gender selection */}
                <div className="space-y-1.5">
                  <label htmlFor="gender" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Gender
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <User className="h-4 w-4" />
                    </span>
                    <select
                      id="gender"
                      suppressHydrationWarning
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
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

                {/* PIN Code */}
                <div className="space-y-1.5">
                  <label htmlFor="pincode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    PIN Code {pincodeLoading && <span className="text-[10px] text-deepskyblue animate-pulse">(fetching...)</span>}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      id="pincode"
                      suppressHydrationWarning
                      type="text"
                      maxLength={6}
                      placeholder="6-digit PIN Code"
                      value={formData.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setFormData((prev) => ({ ...prev, pincode: val }));
                        if (val.length === 6) {
                          handlePincodeLookup(val);
                        }
                      }}
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label htmlFor="state" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    State
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      id="state"
                      suppressHydrationWarning
                      type="text"
                      placeholder="Auto-detected State"
                      value={formData.state}
                      readOnly
                      className="block w-full pl-9 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm focus:outline-none pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <label htmlFor="district" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                  District
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    id="district"
                    suppressHydrationWarning
                    type="text"
                    required
                    placeholder="Enter District"
                    value={formData.district}
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
                    placeholder="Enter house, block, area, and pincode details"
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
                  Associate Referral Code (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="agentCode"
                    suppressHydrationWarning
                    type="text"
                    placeholder="Enter Associate referral code if you have one"
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
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${formData.profilePicUrl
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
                          <img src={resolveFileUrl(formData.profilePicUrl)} className="h-full w-full object-cover" alt="Profile Preview" />
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
                      Admit/Intermediate Admit Card <span className="text-rose-500">*</span>
                    </label>
                    {formData.admitUrl && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    )}
                  </div>
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${formData.admitUrl
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
                          <p className="text-xs font-bold text-slate-700">Select Admit/Intermediate Admit Card Document</p>
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
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${formData.qualificationUrl
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
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${formData.extraQualificationUrl
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

                {/* Candidate Signature Upload */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Candidate Signature (Required) <span className="text-rose-500">*</span>
                    </label>
                    {formData.signatureUrl && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                    )}
                  </div>
                  <div className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all p-5 text-center flex flex-col items-center justify-center min-h-[120px] ${formData.signatureUrl
                    ? "bg-emerald-50/20 border-emerald-500/40 hover:bg-emerald-50/35"
                    : "bg-slate-50/60 border-slate-200/80 hover:bg-deepskyblue-light/10 hover:border-deepskyblue"
                    }`}>
                    <input
                      type="file"
                      id="signature-file"
                      suppressHydrationWarning
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "signatureUrl")}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />

                    {uploadingSignature ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 border-3 border-deepskyblue/30 border-t-deepskyblue rounded-full animate-spin" />
                        <span className="text-[11px] font-bold text-deepskyblue-dark animate-pulse">Uploading Signature...</span>
                      </div>
                    ) : formData.signatureUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="max-w-full px-2">
                          <p className="text-xs font-bold text-slate-700 break-all">{signatureFileName || "signature_image"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Click or drag to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-deepskyblue-light/50 flex items-center justify-center text-deepskyblue-dark">
                          <Upload className="h-5 w-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Select Signature Image</p>
                          <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, JPEG up to 2MB</p>
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

          {/* STEP 3: Email & Password */}
          {step === 3 && (
            <div className="space-y-6 print:hidden">
              <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-6 w-6 text-deepskyblue flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Create Account</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Enter your email and choose a password to complete registration.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Candidate Email Address
                  </label>
                  <div className="relative">
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
                    minLength={6}
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
                  disabled={submitLoading || !formData.email || !formData.password}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-deepskyblue to-sky-600 hover:from-deepskyblue-dark hover:to-sky-700 font-bold text-white text-sm transition-all duration-200 shadow-md shadow-deepskyblue/15 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Register Candidate</span>
                      <CheckCircle className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

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

              <RegistrationIdCard candidate={registeredCandidate} />

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
                      category: "GEN",
                      gender: "MALE",
                      email: "",
                      phone: "",
                      district: "",
                      address: "",
                      course: "",
                      admitUrl: "",
                      qualificationUrl: "",
                      extraQualificationUrl: "",
                      signatureUrl: "",
                      password: "",
                      agentCode: "",
                      profilePicUrl: "",
                      pincode: "",
                      state: "",
                    });
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
