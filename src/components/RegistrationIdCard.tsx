"use client";

import { resolveFileUrl } from "@/lib/fileUrl";

export const REGISTRATION_ID_CARD_PRINT_ID = "registration-id-card-print-area";

export type RegistrationCandidate = {
  name: string;
  registrationId: string;
  fatherName?: string;
  motherName?: string;
  dob?: string | Date;
  course?: string;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  district?: string;
  profilePicUrl?: string | null;
  createdAt?: string | Date;
};

type RegistrationIdCardProps = {
  candidate: RegistrationCandidate;
  className?: string;
};

export function RegistrationIdCard({ candidate, className = "" }: RegistrationIdCardProps) {
  const initials = candidate.name
    ? candidate.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";

  const issuedAt = candidate.createdAt
    ? new Date(candidate.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

  return (
    <div
      id={REGISTRATION_ID_CARD_PRINT_ID}
      className={`w-full max-w-lg bg-white border border-slate-250 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden text-left bg-gradient-to-br from-white via-slate-50/50 to-deepskyblue-light/20 print:shadow-none print:border print:border-slate-300 print:rounded-xl print:bg-white print:text-black ${className}`}
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40 print:hidden">
        <div className="absolute w-64 h-64 rounded-full bg-deepskyblue/8 blur-[80px] -top-20 -left-20" />
        <div className="absolute w-64 h-64 rounded-full bg-deepskyblue-dark/4 blur-[80px] -bottom-20 -right-20" />
      </div>

      <div className="flex justify-between items-start border-b border-slate-200/80 pb-4 mb-5 relative z-10 print:border-slate-300">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2 print:text-black">
            <div className="h-6 w-6 rounded-md bg-deepskyblue flex items-center justify-center text-xs font-black tracking-wider text-white print:bg-deepskyblue">
              S
            </div>
            SUPPORT MISSION INDIA
          </h3>
          <p className="text-[10px] uppercase font-bold text-deepskyblue-dark tracking-widest mt-0.5 print:text-slate-700">
            Candidate Registration ID Card
          </p>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-bold bg-deepskyblue/10 text-deepskyblue-dark border border-deepskyblue/20 px-2 py-0.5 rounded-full print:border-slate-300 print:text-slate-700">
            Active Student
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 relative z-10">
        <div className="sm:col-span-3 flex flex-col items-center sm:items-start">
          <div className="h-24 w-20 bg-slate-100 border border-slate-250 rounded-xl overflow-hidden flex flex-col items-center justify-center text-slate-400 shadow-inner bg-gradient-to-b from-white to-slate-50 print:border-slate-300">
            {candidate.profilePicUrl ? (
              <img
                src={resolveFileUrl(candidate.profilePicUrl)}
                className="h-full w-full object-cover"
                alt="Student Photo"
              />
            ) : (
              <>
                <span className="text-2xl font-black text-slate-500 uppercase">{initials}</span>
                <span className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  Candidate
                </span>
              </>
            )}
          </div>
        </div>

        <div className="sm:col-span-9 space-y-2.5 text-xs text-slate-600 print:text-black">
          <DetailRow label="Registration ID" value={candidate.registrationId} strong />
          <DetailRow label="Candidate Name" value={candidate.name} strong />
          <DetailRow label="Father's Name" value={candidate.fatherName || "N/A"} />
          <DetailRow label="Mother's Name" value={candidate.motherName || "N/A"} />
          <DetailRow
            label="Date of Birth"
            value={candidate.dob ? new Date(candidate.dob).toLocaleDateString("en-GB") : "N/A"}
          />
          <DetailRow label="Course Program" value={candidate.course || "N/A"} accent />
          <DetailRow label="Category" value={candidate.category || "GEN"} strong />
          <DetailRow label="Phone Number" value={candidate.phone || "N/A"} />
          <DetailRow label="Email Mail ID" value={candidate.email || "N/A"} truncate />
          <DetailRow label="Address" value={candidate.address || "N/A"} multiline />
          <DetailRow label="District" value={candidate.district || "N/A"} strong />
        </div>
      </div>

      <div className="mt-6 border-t border-slate-200/80 pt-4 flex justify-between items-end relative z-10 print:border-slate-300">
        <div className="text-[9px] text-slate-400 print:text-slate-600">
          <p>Issued: {issuedAt}</p>
          <p className="mt-0.5 text-slate-500 font-medium print:text-slate-700">Website: app.smi.in.net</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] uppercase font-bold tracking-wider text-slate-400 print:text-slate-500">
            Verified Registration ID
          </p>
          <p className="text-xs font-mono font-bold text-slate-800 print:text-black">{candidate.registrationId}</p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong = false,
  accent = false,
  truncate = false,
  multiline = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
  truncate?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-slate-400 font-semibold print:text-slate-600">{label}</span>
      <span
        className={`col-span-2 print:text-black ${
          strong
            ? "font-bold text-slate-900"
            : accent
              ? "text-deepskyblue-dark font-bold print:text-slate-800"
              : "text-slate-700 font-medium"
        } ${truncate ? "truncate" : ""} ${multiline ? "break-words leading-relaxed" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function printRegistrationIdCard() {
  document.body.classList.add("print-registration-id-card");
  const cleanup = () => {
    document.body.classList.remove("print-registration-id-card");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
