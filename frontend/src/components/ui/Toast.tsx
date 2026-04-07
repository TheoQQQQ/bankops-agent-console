"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";
import type { Toast } from "@/hooks/useToast";

interface ToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  error:   <XCircle className="h-4 w-4 text-red-400" />,
  info:    <AlertTriangle className="h-4 w-4 text-blue-400" />,
};

const styles = {
  success: "border-emerald-700/50 bg-emerald-900/30",
  error:   "border-red-700/50 bg-red-900/30",
  info:    "border-blue-700/50 bg-blue-900/30",
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={`
        flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg
        backdrop-blur-sm transition-all animate-in slide-in-from-right-5
        ${styles[toast.type]}
      `}
    >
      <span className="mt-0.5 flex-shrink-0">{icons[toast.type]}</span>
      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
        )}
        <p className="text-sm text-slate-300">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}