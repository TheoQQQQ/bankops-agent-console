"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getActiveCases, getAuditLog, postDecision } from "@/lib/api";
import type { AgentStatus, AiAnalysis, AuditEntry, CustomerCase, DecisionRequest } from "@/types";

const POLL_INTERVAL_MS = 30_000; // Refresh case list every 30 seconds

/**
 * Central state hook for the BankOps console.
 *
 * Responsibilities:
 * - Loads and periodically refreshes the active case list
 * - Manages the selected case and its audit trail
 * - Orchestrates the AI analysis flow
 * - Submits operator decisions
 */
export function useCases() {
  const [cases, setCases]           = useState<CustomerCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<CustomerCase | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [agentStatus, setAgentStatus]   = useState<AgentStatus>("idle");
  const [analysis, setAnalysis]         = useState<AiAnalysis | null>(null);
  const [agentError, setAgentError]     = useState<string | null>(null);
  const [isLoadingCases, setIsLoadingCases] = useState(true);
  const [casesError, setCasesError]         = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----------------------------------------------------------------
  // Load active cases (with polling)
  // ----------------------------------------------------------------

  const loadCases = useCallback(async () => {
    try {
      const data = await getActiveCases();
      setCases(data);
      setCasesError(null);

      // Keep the selected case in sync if it was updated server-side
      setSelectedCase((prev) => {
        if (!prev) return prev;
        return data.find((c) => c.id === prev.id) ?? prev;
      });
    } catch (err) {
      setCasesError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setIsLoadingCases(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
    pollRef.current = setInterval(() => void loadCases(), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadCases]);

  // ----------------------------------------------------------------
  // Select a case – also loads its audit trail
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
        body: JSON.stringify(selectedCase),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json() as AiAnalysis;
      setAnalysis(result);
      setAgentStatus("done");

      // Refresh audit trail to include the AI_ANALYSED entry
      const trail = await getAuditLog(selectedCase.id);
      setAuditEntries(trail);

      // Refresh case list (status may have changed to UNDER_REVIEW)
      void loadCases();
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : "Unknown error");
      setAgentStatus("error");
    }
  }, [selectedCase, loadCases]);

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
        // Pass AI recommendation so backend can detect overrides
        aiRecommendation: analysis?.recommendation ?? undefined,
      };

      const updated = await postDecision(selectedCase.id, body);
      setSelectedCase(updated);

      // Refresh
      const [trail] = await Promise.all([
        getAuditLog(selectedCase.id),
        loadCases(),
      ]);
      setAuditEntries(trail);
    },
    [selectedCase, loadCases]
  );

  return {
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
  };
}
