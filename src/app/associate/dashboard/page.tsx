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
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Eye,
  X,
  MapPin,
  CreditCard,
} from "lucide-react";

type ReferredStudent = {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  dob: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  course: string;
  category: string;
  gender: string;
  registrationId: string;
  agentCode?: string | null;
  isPaid: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function AssociateDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [associate, setAssociate] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    agentCode?: string;
    createdAt?: string;
  } | null>(null);
  const [students, setStudents] = useState<ReferredStudent[]>([]);
  const [studentsError, setStudentsError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<ReferredStudent | null>(null);

  useEffect(() => {
    const fetchAssociateData = async () => {
      try {
        const resAssociate = await fetch("/api/associate/me");
        const dataAssociate = await resAssociate.json();
        if (resAssociate.ok && dataAssociate.success) {
          setAssociate(dataAssociate.associate);

          const resStudents = await fetch("/api/associate/students");
          const dataStudents = await resStudents.json();
          if (resStudents.ok && dataStudents.success) {
            setStudents(dataStudents.students || []);
            setStudentsError("");
          } else {
            setStudentsError(dataStudents.error || "Failed to load referred students");
          }
          setLoading(false);
        } else {
          router.push("/associate/login");
        }
      } catch (err) {
        console.error("Associate dashboard load error:", err);
        router.push("/associate/login");
      }
    };
    fetchAssociateData();
  }, [router]);

  const handleCopyCode = () => {
    if (!associate?.agentCode) return;
    navigator.clipboard.writeText(associate.agentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/associate/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/associate/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      router.push("/associate/login");
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredStudents = students.filter((student) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      student.name?.toLowerCase().includes(term) ||
      student.email?.toLowerCase().includes(term) ||
      student.phone?.includes(term) ||
      student.registrationId?.toLowerCase().includes(term) ||
      student.course?.toLowerCase().includes(term) ||
      student.district?.toLowerCase().includes(term) ||
      student.fatherName?.toLowerCase().includes(term)
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
            Verifying Associate Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[350px] h-[350px] rounded-full bg-deepskyblue/8 blur-[90px] top-[-100px] left-[-100px]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-sky-400/5 blur-[100px] bottom-0 right-0" />
      </div>

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
            <span className="text-xs font-bold text-slate-900">{associate?.name}</span>
            <span className="text-[10px] font-semibold text-slate-400">{associate?.email}</span>
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

      <main className="relative z-10 max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-200/25 p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="h-12 w-12 rounded-full bg-deepskyblue-light flex items-center justify-center text-deepskyblue-dark font-extrabold text-xl shadow-inner">
                {associate?.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{associate?.name}</h2>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Approved Associate
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-655">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{associate?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{associate?.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Partner since: {formatDate(associate?.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-855 rounded-2xl shadow-xl shadow-slate-900/20 p-6 text-white space-y-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-deepskyblue/10 blur-2xl" />

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-deepskyblue uppercase tracking-widest">Your Partner Referral Code</span>
              <h3 className="text-xs text-slate-400 leading-normal">
                Share this referral code with students. They must enter this code when signing up at /signup.
              </h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <span className="font-mono font-black text-xl text-deepskyblue tracking-wider">{associate?.agentCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-2.5 rounded-lg bg-deepskyblue hover:bg-deepskyblue-dark text-white font-bold text-xs transition-all active:scale-[0.95] flex items-center gap-1.5 cursor-pointer shadow-md shadow-deepskyblue/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

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

        <section className="lg:col-span-8 bg-white border border-slate-200/85 rounded-2xl shadow-xl shadow-slate-200/25 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Referred Students</h2>
              <p className="text-slate-500 text-xs mt-1">
                Students who registered using your code: <span className="font-mono font-bold text-deepskyblue">{associate?.agentCode}</span>
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-deepskyblue focus:ring-4 focus:ring-deepskyblue/10"
              />
            </div>
          </div>

          {studentsError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
              {studentsError}
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-550 uppercase text-[9px] tracking-wider font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold">Student</th>
                  <th className="py-3.5 px-4 font-bold">Registration ID</th>
                  <th className="py-3.5 px-4 font-bold">Course</th>
                  <th className="py-3.5 px-4 font-bold">District</th>
                  <th className="py-3.5 px-4 font-bold">Payment</th>
                  <th className="py-3.5 px-4 font-bold">Registered</th>
                  <th className="py-3.5 px-4 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
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
                      <td className="py-4 px-4 text-slate-600">{student.district}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            student.isPaid
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          <CreditCard className="h-3 w-3" />
                          {student.isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400 font-medium">
                        {formatDate(student.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-deepskyblue hover:text-deepskyblue text-slate-600 font-bold text-[10px] transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center font-bold text-slate-400">
                      {students.length === 0
                        ? "No students have registered with your referral code yet."
                        : "No students match your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-[10px] font-mono text-deepskyblue mt-0.5">{selectedStudent.registrationId}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                aria-label="Close details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Father's Name" value={selectedStudent.fatherName} />
                <DetailItem label="Mother's Name" value={selectedStudent.motherName} />
                <DetailItem label="Date of Birth" value={formatDate(selectedStudent.dob)} />
                <DetailItem label="Gender" value={selectedStudent.gender} />
                <DetailItem label="Category" value={selectedStudent.category} />
                <DetailItem label="Course" value={selectedStudent.course} />
                <DetailItem label="Email" value={selectedStudent.email} />
                <DetailItem label="Phone" value={selectedStudent.phone} />
                <DetailItem label="District" value={selectedStudent.district} />
                <DetailItem label="State" value={selectedStudent.state || "N/A"} />
                <DetailItem label="PIN Code" value={selectedStudent.pincode || "N/A"} />
                <DetailItem label="Registered On" value={formatDate(selectedStudent.createdAt)} />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Address</p>
                <p className="text-slate-700 font-medium flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  {selectedStudent.address}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                    selectedStudent.isPaid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}
                >
                  <CreditCard className="h-3 w-3" />
                  Payment: {selectedStudent.isPaid ? "Completed" : "Pending"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Code used: {selectedStudent.agentCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="text-slate-800 font-semibold">{value}</p>
    </div>
  );
}
