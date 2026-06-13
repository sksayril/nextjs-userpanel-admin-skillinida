"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const res = await fetch("/api/admin/auth/me");
        const data = await res.json();
        if (res.ok && data.success) {
          router.push("/admin/dashboard");
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/admin/login");
      }
    };
    checkAdminSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans select-none">
      <div className="absolute w-[350px] h-[350px] rounded-full bg-deepskyblue/8 blur-[80px] animate-pulse" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-deepskyblue to-sky-600 flex items-center justify-center shadow-lg shadow-deepskyblue/20 mb-2">
          <Sparkles className="h-6 w-6 text-white animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <p className="text-slate-505 text-sm font-bold tracking-wider uppercase animate-pulse">
          Verifying Admin Session...
        </p>
      </div>
    </div>
  );
}
