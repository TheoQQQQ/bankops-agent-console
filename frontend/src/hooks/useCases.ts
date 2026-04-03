"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getActiveCases, getAuditLog, postDecision } from "@/lib/api";
import type { AgentStatus, AiAnalysis, AuditEntry, CustomerCase, DecisionRequest } from "@/types";

const POLL_INTERVAL_MS = 30_000;

/**
 * Central state hook for the BankOps console.
 *
 * Manages active cases (with pagination + polling), selected case,
 * audit trail, AI analysis flow, and operator decision submission.
 */
export function useCases() {
  const [cases, setCases]               = useState<CustomerCase[]>([]);
  const [totalCases, setTotalCases]     = useState(0);
  const [currentPage, setCurrentPage]   = useState(0);
  const [selectedCase, setSelectedCase] = useState<CustomerCase | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [agentStatus, setAgentStatus]   = useState<AgentStatus>("idle");
  const [analysis, setAnalysis]         = useState<AiAnalysis | null>(null);
  const [agentError, setAgentError]     = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [casesError, setCasesError]         = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----------------------------------------------------------------
  // Load cases (paginated, with polling)
  // ----------------------------------------------------------------

  const loadCases = useCallback(async (page = 0) => {
    try {
      const data = await getActiveCases(page, 20);
      setCases(data.content);
      setTotalCases(data.totalElements);
      setCurrentPage(data.number);
      setCasesError(null);

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
        operator: "demo.operator",
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

  return {
    cases,
    totalCases,
    currentPage,
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
    loadPage: loadCases,
  };
}
