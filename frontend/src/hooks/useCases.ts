"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getActiveCases, getAuditLog, postDecision, postNote } from "@/lib/api";
import type {
  AgentStatus,
  AiAnalysis,
  AuditEntry,
  CaseFilters,
  CaseType,
  CustomerCase,
  DecisionRequest,
  NoteRequest,
  RiskLevel,
  SortDirection,
  SortField,
} from "@/types";

const POLL_INTERVAL_MS = 30_000;

const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH:     1,
  MEDIUM:   2,
  LOW:      3,
};

const DEFAULT_FILTERS: CaseFilters = {
  search:        "",
  riskLevel:     "ALL",
  caseType:      "ALL",
  sortField:     "createdAt",
  sortDirection: "desc",
};

/**
 * Central state hook for the BankOps console.
 *
 * Manages active cases (with pagination + polling), selected case,
 * audit trail, AI analysis flow, operator decision submission,
 * case notes, search/filter/sort, and toast-ready callbacks.
 */
export function useCases() {
  const [cases, setCases]               = useState<CustomerCase[]>([]);
  const [totalCases, setTotalCases]     = useState(0);
  const [currentPage, setCurrentPage]   = useState(0);
  const [totalPages, setTotalPages]     = useState(0);
  const [selectedCase, setSelectedCase] = useState<CustomerCase | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [agentStatus, setAgentStatus]   = useState<AgentStatus>("idle");
  const [analysis, setAnalysis]         = useState<AiAnalysis | null>(null);
  const [agentError, setAgentError]     = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [casesError, setCasesError]         = useState<string | null>(null);
  const [isGenerating, setIsGenerating]     = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [filters, setFilters]           = useState<CaseFilters>(DEFAULT_FILTERS);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----------------------------------------------------------------
  // Load cases (paginated, with polling)
  // ----------------------------------------------------------------

  const loadCases = useCallback(async (page = 0) => {
    try {
      const data = await getActiveCases(page, 20);
      setCases(data.content);
      setTotalCases(data.totalElements);
      setTotalPages(data.totalPages);
      setCurrentPage(data.number);
      setCasesError(null);
      setLastRefreshed(new Date());

      setSelectedCase((prev) => {
        if (!prev) return prev;
        return data.content.find((c) => c.id === prev.id) ?? prev;
      });
    } catch (err) {
      setCasesError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    void loadCases(0);
    pollRef.current = setInterval(() => void loadCases(currentPage), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCases]);

  // ----------------------------------------------------------------
  // Client-side filter + sort
  // ----------------------------------------------------------------

  const filteredCases = cases
    .filter((c) => {
      const q = filters.search.toLowerCase();
      if (q && !(
        c.customerName.toLowerCase().includes(q) ||
        c.caseRef.toLowerCase().includes(q) ||
        c.customerId.toLowerCase().includes(q)
      )) return false;
      if (filters.riskLevel !== "ALL" && c.riskLevel !== filters.riskLevel) return false;
      if (filters.caseType  !== "ALL" && c.caseType  !== filters.caseType)  return false;
      return true;
    })
    .sort((a, b) => {
      const dir = filters.sortDirection === "asc" ? 1 : -1;
      switch (filters.sortField) {
        case "riskLevel":    return dir * (RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
        case "amount":       return dir * ((a.amount ?? 0) - (b.amount ?? 0));
        case "customerName": return dir * a.customerName.localeCompare(b.customerName);
        case "createdAt":
        default:             return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });

  const setSearch        = useCallback((search: string) =>
    setFilters((f) => ({ ...f, search })), []);
  const setRiskFilter    = useCallback((riskLevel: RiskLevel | "ALL") =>
    setFilters((f) => ({ ...f, riskLevel })), []);
  const setCaseTypeFilter = useCallback((caseType: CaseType | "ALL") =>
    setFilters((f) => ({ ...f, caseType })), []);
  const setSort          = useCallback((sortField: SortField, sortDirection: SortDirection) =>
    setFilters((f) => ({ ...f, sortField, sortDirection })), []);
  const resetFilters     = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // ----------------------------------------------------------------
  // Select a case
  // ----------------------------------------------------------------

  const selectCase = useCallback(async (c: CustomerCase) => {
    setSelectedCase(c);
    setAnalysis(null);
    setAgentStatus("idle");
    setAgentError(null);

    try {
      const trail = await getAuditLog(c.id);
      setAuditEntries(trail);
    } catch {
      setAuditEntries([]);
    }
  }, []);

  // ----------------------------------------------------------------
  // AI analysis
  // ----------------------------------------------------------------

  const runAnalysis = useCallback(async () => {
    if (!selectedCase) return;

    setAgentStatus("fetching");
    setAnalysis(null);
    setAgentError(null);

    try {
      setAgentStatus("analysing");
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(selectedCase),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json() as AiAnalysis;
      setAnalysis(result);
      setAgentStatus("done");

      const trail = await getAuditLog(selectedCase.id);
      setAuditEntries(trail);

      void loadCases(currentPage);
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Unknown error");
      setAgentStatus("error");
    }
  }, [selectedCase, loadCases, currentPage]);

  // ----------------------------------------------------------------
  // Operator decision
  // ----------------------------------------------------------------

  const submitDecision = useCallback(
    async (
      decision: "APPROVED" | "REJECTED" | "ESCALATED",
      rationale: string
    ) => {
      if (!selectedCase) return;

      const body: DecisionRequest = {
        decision,
        operator: localStorage.getItem("bankops_user") ?? "demo.operator",
        rationale,
        aiRecommendation: analysis?.recommendation ?? undefined,
      };

      const updated = await postDecision(selectedCase.id, body);
      setSelectedCase(updated);

      const [trail] = await Promise.all([
        getAuditLog(selectedCase.id),
        loadCases(currentPage),
      ]);
      setAuditEntries(trail);
    },
    [selectedCase, analysis, loadCases, currentPage]
  );

  // ----------------------------------------------------------------
  // Case notes
  // ----------------------------------------------------------------

  const submitNote = useCallback(
    async (note: string) => {
      if (!selectedCase) return;
      setIsSubmittingNote(true);
      try {
        const body: NoteRequest = {
          note,
          operator: localStorage.getItem("bankops_user") ?? "demo.operator",
        };
        await postNote(selectedCase.id, body);
        const trail = await getAuditLog(selectedCase.id);
        setAuditEntries(trail);
      } finally {
        setIsSubmittingNote(false);
      }
    },
    [selectedCase]
  );

  // ----------------------------------------------------------------
  // AI case generation
  // ----------------------------------------------------------------

  const generateCases = useCallback(async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      await loadCases(0);
    } finally {
      setIsGenerating(false);
    }
  }, [loadCases]);

  return {
    // data
    cases: filteredCases,
    rawCases: cases,
    totalCases,
    totalPages,
    currentPage,
    selectedCase,
    auditEntries,
    lastRefreshed,
    // agent
    agentStatus,
    analysis,
    agentError,
    // loading states
    isLoadingCases,
    casesError,
    isGenerating,
    isSubmittingNote,
    // filters
    filters,
    setSearch,
    setRiskFilter,
    setCaseTypeFilter,
    setSort,
    resetFilters,
    // actions
    selectCase,
    runAnalysis,
    submitDecision,
    submitNote,
    generateCases,
    loadPage: loadCases,
  };
}