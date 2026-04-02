"use client";

import { useState } from "react";
import type { AiAnalysis, CustomerCase } from "@/types";
import { Spinner } from "@/components/ui/Spinner";

interface DecisionPanelProps {
  selectedCase: CustomerCase | null;
  analysis: AiAnalysis | null;
  onDecision: (
    decision: "APPROVED" | "REJECTED" | "ESCALATED",
    rationale: string
  ) => Promise<void>;
}

/**
 * Human-in-the-loop decision panel.
 * The operator must provide a rationale before any decision is submitted.
 * This enforces accountability and satisfies audit requirements.
 */
export function DecisionPanel({ selectedCase, analysis, onDecision }: DecisionPanelProps) {
  const [rationale, setRationale] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const isActionable =
    selectedCase &&
    (selectedCase.status === "PENDING" || selectedCase.status === "UNDER_REVIEW");

  const canSubmit = rationale.trim().length >= 10 && !pending;

  async function handleDecision(decision: "APPROVED" | "REJECTED" | "ESCALATED") {
    if (!canSubmit) return;
    setPending(decision);
    try {
      await onDecision(decision, rationale.trim());
      setRationale("");
    } finally {
      setPending(null);
    }
  }

  if (!selectedCase) {
    return (
      <div className="card">
        <p className="text-sm text-slate-500">Select a case to make a decision.</p>
      </div>
    );
  }

  if (!isActionable) {
    return (
      <div className="card">
        <p className="text-sm text-slate-400">
          Case <strong>{selectedCase.caseRef}</strong> is in a terminal state (
          <strong>{selectedCase.status}</strong>) and cannot receive further decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-200">Operator Decision</h2>

      {/* AI hint */}
      {analysis && (
        <p className="rounded-md bg-white/5 px-3 py-2 text-xs text-slate-400">
          AI recommends:{" "}
          <strong className="text-slate-200">{analysis.recommendation}</strong> with{" "}
          {analysis.confidencePercent}% confidence.
        </p>
      )}

      {/* Rationale input */}
      <div>
        <label
          htmlFor="rationale"
          className="mb-1.5 block text-xs font-medium text-slate-400"
        >
          Decision Rationale <span className="text-red-400">*</span>
          <span className="ml-1 text-slate-600">(min. 10 characters)</span>
        </label>
        <textarea
          id="rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="State the reason for your decision…"
          rows={3}
          maxLength={2000}
          className="
            w-full rounded-md border border-border bg-surface px-3 py-2 text-sm
            text-slate-200 placeholder-slate-600 focus:border-brand-500 focus:outline-none
            focus:ring-1 focus:ring-brand-500 resize-none
          "
        />
        <p className="mt-1 text-right text-xs text-slate-600">
          {rationale.length} / 2000
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleDecision("APPROVED")}
          disabled={!canSubmit}
          className="btn-primary flex-1"
        >
          {pending === "APPROVED" ? <Spinner size="sm" /> : "Approve"}
        </button>
        <button
          onClick={() => handleDecision("REJECTED")}
          disabled={!canSubmit}
          className="btn-danger flex-1"
        >
          {pending === "REJECTED" ? <Spinner size="sm" /> : "Reject"}
        </button>
        <button
          onClick={() => handleDecision("ESCALATED")}
          disabled={!canSubmit}
          className="btn-ghost flex-1 border border-border"
        >
          {pending === "ESCALATED" ? <Spinner size="sm" /> : "Escalate"}
        </button>
      </div>
    </div>
  );
}
