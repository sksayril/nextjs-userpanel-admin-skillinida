"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
  duration?: number;
}

interface ToastContextType {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: "success" | "error", duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Mirror to browser console as requested by user
    if (type === "success") {
      console.log(`[Toast Success] ${message}`);
    } else {
      console.error(`[Toast Error] ${message}`);
    }

    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    addToast(message, "success", duration);
  }, [addToast]);

  const error = useCallback((message: string, duration?: number) => {
    addToast(message, "error", duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Embedded style block for guaranteed smooth keyframe animations */}
      <style jsx global>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-toast-in {
          animation: toast-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const isSuccess = toast.type === "success";

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 w-full p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-toast-in ${
        isSuccess
          ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-900 dark:text-emerald-200"
          : "bg-rose-500/10 border-rose-500/35 text-rose-900 dark:text-rose-200"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        )}
      </div>
      
      <div className="flex-1 text-sm font-medium leading-relaxed break-words pr-2">
        {toast.message}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
