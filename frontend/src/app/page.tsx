"use client";

import { useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { CaseCard } from "@/components/ui/CaseCard";
import { AiPanel } from "@/components/agent/AiPanel";
import { DecisionPanel } from "@/components/agent/DecisionPanel";
import { AuditTimeline } from "@/components/ui/AuditTimeline";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { useCases } from "@/hooks/useCases";
import {
  caseTypeLabel,
  formatAmount,
  formatDate,
  riskBadgeBg,
  statusBadgeBg,
} from "@/lib/utils";
import { AlertTriangle, ShieldAlert, Clock } from "lucide-react";
import type { CustomerCase } from "@/types";

/**
 * Root page – three-column operator dashboard.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Navbar                                                     │
 * ├──────────────┬──────────────────────────┬───────────────────┤
 * │  Case list   │  Case detail + AI panel  │  Audit timeline   │
 * └──────────────┴──────────────────────────┴───────────────────┘
 */
export default function DashboardPage() {
  const {
    cases,
    selectedCase,
    auditEntries,
    agentStatus,
    analysis,
    agentError,
    isLoadingCases,
    casesError,
    selectCase,
    runAnalysis,
    submitDecision,
  } = useCases();

  // ── Keyboard shortcuts ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when focus is inside a textarea or input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (!selectedCase) return;

      const isActionable =
        selectedCase.status === "PENDING" || selectedCase.status === "UNDER_REVIEW";
      if (!isActionable) return;

      if (e.key === "a" || e.key === "A") {
        // Only fire if rationale is long enough — DecisionPanel validates internally
        // We trigger via a custom event picked up by DecisionPanel
        document.dispatchEvent(new CustomEvent("bankops:decision", { detail: "APPROVED" }));
      } else if (e.key === "r" || e.key === "R") {
        document.dispatchEvent(new CustomEvent("bankops:decision", { detail: "REJECTED" }));
      } else if (e.key === "e" || e.key === "E") {
        document.dispatchEvent(new CustomEvent("bankops:decision", { detail: "ESCALATED" }));
      }
    },
    [selectedCase]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // ── Case statistics ─────────────────────────────────────────
  const stats = {
    total:    cases.length,
    critical: cases.filter((c) => c.riskLevel === "CRITICAL").length,
    high:     cases.filter((c) => c.riskLevel === "HIGH").length,
    pending:  cases.filter((c) => c.status === "PENDING").length,
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-6 border-b border-border bg-panel/50 px-6 py-2.5">
        <StatPill
          label="Active cases"
          value={stats.total}
          colour="text-slate-300"
        />
        <StatPill
          label="Pending"
          value={stats.pending}
          colour="text-amber-300"
          icon={<Clock className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="High risk"
          value={stats.high}
          colour="text-orange-300"
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
        />
        <StatPill
          label="Critical"
          value={stats.critical}
          colour="text-red-400"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
      </div>

      <main className="flex min-h-0 flex-1 gap-0">
        {/* ── Column 1: Case list ──────────────────────────────── */}
        <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h1 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Cases
            </h1>
            {isLoadingCases && <Spinner size="sm" className="text-slate-500" />}
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {casesError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {casesError}
              </div>
            )}

            {!isLoadingCases && cases.length === 0 && !casesError && (
              <p className="mt-4 text-center text-sm text-slate-500">
                No active cases — all clear.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {cases.map((c) => (
                <CaseCard
                  key={c.id}
                  customerCase={c}
                  isSelected={selectedCase?.id === c.id}
                  onClick={() => void selectCase(c)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── Column 2: Case detail + AI panel ─────────────────── */}
        <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {!selectedCase ? (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-slate-500">
                Select a case on the left to begin.
              </p>
            </div>
          ) : (
            <>
              {/* Case header */}
              <div className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500">
                      {selectedCase.caseRef} · {selectedCase.customerId}
                    </p>
                    <h2 className="mt-0.5 text-lg font-bold text-slate-100">
                      {selectedCase.customerName}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Created {formatDate(selectedCase.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={riskBadgeBg(selectedCase.riskLevel)}>
                      {selectedCase.riskLevel}
                    </Badge>
                    <Badge className={statusBadgeBg(selectedCase.status)}>
                      {selectedCase.status.replace("_", " ")}
                    </Badge>
                    <Badge className="bg-slate-800 text-slate-300 ring-slate-600/30">
                      {caseTypeLabel(selectedCase.caseType)}
                    </Badge>
                    {selectedCase.amount !== null && (
                      <Badge className="bg-slate-800 text-slate-300 ring-slate-600/30">
                        {formatAmount(selectedCase.amount)}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  {selectedCase.description}
                </p>
              </div>

              {/* AI Panel */}
              <AiPanel
                status={agentStatus}
                analysis={analysis}
                error={agentError}
                onAnalyse={() => void runAnalysis()}
                selectedCase={selectedCase}
              />

              {/* Decision Panel */}
              <DecisionPanel
                selectedCase={selectedCase}
                analysis={analysis}
                onDecision={submitDecision}
              />
            </>
          )}
        </section>

        {/* ── Column 3: Audit timeline ──────────────────────────── */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-l border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audit Trail
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedCase ? (
              <p className="text-sm text-slate-500">
                Select a case to view its audit trail.
              </p>
            ) : (
              <AuditTimeline entries={auditEntries} />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

// ── Small helper component ────────────────────────────────────

interface StatPillProps {
  label: string;
  value: number;
  colour: string;
  icon?: React.ReactNode;
}

function StatPill({ label, value, colour, icon }: StatPillProps) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className={colour}>{icon}</span>}
      <span className={`text-sm font-bold ${colour}`}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
