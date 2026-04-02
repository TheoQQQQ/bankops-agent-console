"use client";

import { Badge } from "./Badge";
import {
  caseTypeLabel,
  formatAmount,
  formatDate,
  riskBadgeBg,
  statusBadgeBg,
} from "@/lib/utils";
import type { CustomerCase } from "@/types";
import { AlertTriangle, Clock } from "lucide-react";

interface CaseCardProps {
  customerCase: CustomerCase;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Compact list item for a customer case.
 * Highlights critical-risk cases with a subtle left border accent.
 */
export function CaseCard({ customerCase: c, isSelected, onClick }: CaseCardProps) {
  const isCritical = c.riskLevel === "CRITICAL";

  return (
    <button
      onClick={onClick}
      className={`
        w-full rounded-lg border p-4 text-left transition-all
        ${isSelected
          ? "border-brand-500 bg-brand-900/30 ring-1 ring-brand-500/50"
          : "border-border bg-panel hover:border-slate-500 hover:bg-white/5"
        }
        ${isCritical ? "border-l-4 border-l-red-500" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isCritical && (
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-400" aria-hidden />
            )}
            <span className="truncate text-sm font-semibold text-slate-100">
              {c.customerName}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-slate-500">{c.caseRef}</p>
        </div>

        <Badge className={riskBadgeBg(c.riskLevel)}>{c.riskLevel}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={statusBadgeBg(c.status)}>{c.status.replace("_", " ")}</Badge>
        <Badge className="bg-slate-800 text-slate-300 ring-slate-600/30">
          {caseTypeLabel(c.caseType)}
        </Badge>
        {c.amount !== null && (
          <span className="text-xs text-slate-400">{formatAmount(c.amount)}</span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1 text-xs text-slate-500">
        <Clock className="h-3 w-3" aria-hidden />
        {formatDate(c.createdAt)}
      </div>
    </button>
  );
}
