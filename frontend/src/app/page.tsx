"use client";

import { useEffect, useCallback, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { CaseCard } from "@/components/ui/CaseCard";
import { AiPanel } from "@/components/agent/AiPanel";
import { DecisionPanel } from "@/components/agent/DecisionPanel";
import { AuditTimeline } from "@/components/ui/AuditTimeline";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { ToastContainer } from "@/components/ui/Toast";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useCases } from "@/hooks/useCases";
import { useToast } from "@/hooks/useToast";
import {
  caseTypeLabel,
  formatAmount,
  formatDate,
  riskBadgeBg,
  statusBadgeBg,
} from "@/lib/utils";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  LayoutDashboard,
  List,
} from "lucide-react";
import type { RiskLevel, CaseType, SortField } from "@/types";

export default function DashboardPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"cases" | "dashboard">("cases");
  const [note, setNote] = useState("");

  const {
    cases,
    rawCases,
    totalPages,
    currentPage,
    selectedCase,
    auditEntries,
    agentStatus,
    analysis,
    agentError,
    isLoadingCases,
    casesError,
    isGenerating,
    isSubmittingNote,
    filters,
    lastRefreshed,
    selectCase,
    runAnalysis,
    submitDecision,
    submitNote,
    generateCases,
    setSearch,
    setRiskFilter,
    setCaseTypeFilter,
    setSort,
    resetFilters,
    loadPage,
  } = useCases();

  // ── Keyboard shortcuts ──────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (!selectedCase) return;

      const isActionable =
        selectedCase.status === "PENDING" || selectedCase.status === "UNDER_REVIEW";
      if (!isActionable) return;

      if (e.key === "a" || e.key === "A") {
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

  // ── Wrapped actions with toasts ─────────────────────────────
  const handleGenerate = async () => {
    try {
      await generateCases();
      toast.success("Cases generated successfully", "Done");
    } catch {
      toast.error("Failed to generate cases", "Error");
    }
  };

  const handleRunAnalysis = async () => {
    try {
      await runAnalysis();
      toast.success("Analysis complete", "AI Agent");
    } catch {
      toast.error("Analysis failed", "AI Agent");
    }
  };

  const handleDecision = async (
    decision: "APPROVED" | "REJECTED" | "ESCALATED",
    rationale: string
  ) => {
    try {
      await submitDecision(decision, rationale);
      toast.success(`Case ${decision.toLowerCase()}`, "Decision recorded");
    } catch {
      toast.error("Failed to submit decision", "Error");
    }
  };

  const handleNoteSubmit = async () => {
    if (!note.trim()) return;
    try {
      await submitNote(note.trim());
      setNote("");
      toast.success("Note added to audit trail", "Note saved");
    } catch {
      toast.error("Failed to save note", "Error");
    }
  };

  // ── Case statistics (from raw unfiltered list) ──────────────
  const stats = {
    total:       rawCases.length,
    critical:    rawCases.filter((c) => c.riskLevel === "CRITICAL").length,
    high:        rawCases.filter((c) => c.riskLevel === "HIGH").length,
    pending:     rawCases.filter((c) => c.status === "PENDING").length,
    slaBreached: rawCases.filter((c) => c.slaBreached).length,
  };

  // ── Sort toggle helper ──────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (filters.sortField === field) {
      setSort(field, filters.sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSort(field, "desc");
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />

      {/* ── Stats bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-panel/50 px-6 py-2.5">
        <div className="flex items-center gap-6">
          <StatPill label="Active cases"  value={stats.total}       colour="text-slate-300" />
          <StatPill label="Pending"       value={stats.pending}     colour="text-amber-300"  icon={<Clock         className="h-3.5 w-3.5" />} />
          <StatPill label="High risk"     value={stats.high}        colour="text-orange-300" icon={<ShieldAlert   className="h-3.5 w-3.5" />} />
          <StatPill label="Critical"      value={stats.critical}    colour="text-red-400"    icon={<AlertTriangle className="h-3.5 w-3.5" />} />
          {stats.slaBreached > 0 && (
            <StatPill label="SLA breached" value={stats.slaBreached} colour="text-rose-400" icon={<Clock className="h-3.5 w-3.5" />} />
          )}
          {lastRefreshed && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <RefreshCw className="h-3 w-3" />
              Updated {formatDate(lastRefreshed.toISOString())}
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <TabButton active={activeTab === "cases"}     onClick={() => setActiveTab("cases")}     icon={<List            className="h-3.5 w-3.5" />} label="Cases"     />
          <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard className="h-3.5 w-3.5" />} label="Dashboard" />
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <Dashboard cases={rawCases} />
      ) : (
        <main className="flex min-h-0 flex-1 gap-0">
          {/* ── Column 1: Case list ──────────────────────────────── */}
          <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-surface">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h1 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Cases
                {cases.length !== rawCases.length && (
                  <span className="ml-1.5 rounded-full bg-indigo-700 px-1.5 py-0.5 text-xs text-white">
                    {cases.length}/{rawCases.length}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-2">
                {isLoadingCases && <Spinner size="sm" className="text-slate-500" />}
                <button
                  onClick={() => void handleGenerate()}
                  disabled={isGenerating}
                  className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating
                    ? <Spinner size="sm" className="text-white" />
                    : <Sparkles className="h-3 w-3" />
                  }
                  {isGenerating ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-border px-3 py-2">
              <div className="flex items-center gap-2 rounded-md border border-border bg-panel px-2.5 py-1.5">
                <Search className="h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search name, ref, ID…"
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 border-b border-border px-3 py-2">
              <select
                value={filters.riskLevel}
                onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "ALL")}
                className="flex-1 rounded border border-border bg-panel px-2 py-1 text-xs text-slate-300 outline-none"
              >
                <option value="ALL">All risks</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={filters.caseType}
                onChange={(e) => setCaseTypeFilter(e.target.value as CaseType | "ALL")}
                className="flex-1 rounded border border-border bg-panel px-2 py-1 text-xs text-slate-300 outline-none"
              >
                <option value="ALL">All types</option>
                <option value="FRAUD_ALERT">Fraud</option>
                <option value="KYC_REVIEW">KYC</option>
                <option value="AML_FLAG">AML</option>
                <option value="CREDIT_LIMIT">Credit</option>
              </select>
            </div>

            {/* Sort bar */}
            <div className="flex gap-1 border-b border-border px-3 py-1.5">
              {(["createdAt", "riskLevel", "amount"] as SortField[]).map((field) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs transition-colors ${
                    filters.sortField === field
                      ? "bg-indigo-700/40 text-indigo-300"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <ArrowUpDown className="h-2.5 w-2.5" />
                  {field === "createdAt" ? "Date" : field === "riskLevel" ? "Risk" : "Amount"}
                  {filters.sortField === field && (
                    <span>{filters.sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              ))}
              {(filters.search || filters.riskLevel !== "ALL" || filters.caseType !== "ALL") && (
                <button
                  onClick={resetFilters}
                  className="ml-auto text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Case list */}
            <div className="flex-1 overflow-y-auto p-3">
              {casesError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-300">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {casesError}
                </div>
              )}

              {!isLoadingCases && cases.length === 0 && !casesError && (
                <p className="mt-4 text-center text-sm text-slate-500">
                  {rawCases.length > 0 ? "No cases match your filters." : "No active cases — all clear."}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <button
                  onClick={() => void loadPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="rounded p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => void loadPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="rounded p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </aside>

          {/* ── Column 2: Case detail + AI panel ─────────────────── */}
          <section className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            {!selectedCase ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-slate-500">Select a case on the left to begin.</p>
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
                      {/* SLA badge */}
                      {selectedCase.slaBreached ? (
                        <Badge className="bg-rose-900/50 text-rose-300 ring-rose-500/30">
                          ⚠ SLA Breached
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-800 text-slate-400 ring-slate-600/30">
                          Due {formatDate(selectedCase.dueAt)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    {selectedCase.description}
                  </p>
                </div>

                {/* Case notes */}
                <div className="card">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Add Note
                  </h3>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add an internal note to the audit trail…"
                    rows={3}
                    className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{note.length} / 1000</span>
                    <button
                      onClick={() => void handleNoteSubmit()}
                      disabled={!note.trim() || isSubmittingNote || note.length > 1000}
                      className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmittingNote ? "Saving…" : "Save Note"}
                    </button>
                  </div>
                </div>

                {/* AI Panel */}
                <AiPanel
                  status={agentStatus}
                  analysis={analysis}
                  error={agentError}
                  onAnalyse={() => void handleRunAnalysis()}
                  selectedCase={selectedCase}
                />

                {/* Decision Panel */}
                <DecisionPanel
                  selectedCase={selectedCase}
                  analysis={analysis}
                  onDecision={handleDecision}
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
                <p className="text-sm text-slate-500">Select a case to view its audit trail.</p>
              ) : (
                <AuditTimeline entries={auditEntries} />
              )}
            </div>
          </aside>
        </main>
      )}

      {/* ── Toast notifications ───────────────────────────────── */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}

// ── Small helper components ───────────────────────────────────

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

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-brand-600/20 text-brand-300"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}