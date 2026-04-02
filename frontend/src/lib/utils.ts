import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CaseStatus, CaseType, RiskLevel } from "@/types";

/** Merge Tailwind classes safely (resolves conflicts). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Maps a risk level to a Tailwind colour class. */
export function riskColour(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW:      "text-emerald-400",
    MEDIUM:   "text-amber-400",
    HIGH:     "text-orange-400",
    CRITICAL: "text-red-500",
  };
  return map[level] ?? "text-slate-400";
}

/**
 * Maps a risk level string to a badge bg class.
 * Accepts a plain string so it can be used with AI-returned values
 * without unsafe casts.
 */
export function riskBadgeBg(level: string): string {
  const map: Record<RiskLevel, string> = {
    LOW:      "bg-emerald-900/50 text-emerald-300 ring-emerald-500/30",
    MEDIUM:   "bg-amber-900/50 text-amber-300 ring-amber-500/30",
    HIGH:     "bg-orange-900/50 text-orange-300 ring-orange-500/30",
    CRITICAL: "bg-red-900/50 text-red-300 ring-red-500/30",
  };
  return map[level as RiskLevel] ?? "bg-slate-800 text-slate-300";
}

/** Maps a case status to a badge colour. */
export function statusBadgeBg(status: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    PENDING:      "bg-slate-700 text-slate-200 ring-slate-500/30",
    UNDER_REVIEW: "bg-blue-900/50 text-blue-300 ring-blue-500/30",
    APPROVED:     "bg-emerald-900/50 text-emerald-300 ring-emerald-500/30",
    REJECTED:     "bg-red-900/50 text-red-300 ring-red-500/30",
    ESCALATED:    "bg-purple-900/50 text-purple-300 ring-purple-500/30",
  };
  return map[status] ?? "bg-slate-700 text-slate-200";
}

/** Human-readable labels for case types. */
export function caseTypeLabel(type: CaseType): string {
  const map: Record<CaseType, string> = {
    FRAUD_ALERT:  "Fraud Alert",
    KYC_REVIEW:   "KYC Review",
    CREDIT_LIMIT: "Credit Limit",
    AML_FLAG:     "AML Flag",
  };
  return map[type] ?? type;
}

/** Formats an ISO timestamp to a short locale string. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formats a monetary amount with EUR symbol. */
export function formatAmount(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
