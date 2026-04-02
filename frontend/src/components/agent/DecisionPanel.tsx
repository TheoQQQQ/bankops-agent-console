"use client";

import { useState, useEffect, useRef } from "react";
import type { AiAnalysis, CustomerCase } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { AlertTriangle, AlertCircle } from "lucide-react";

interface DecisionPanelProps {
  selectedCase: CustomerCase | null;
  analysis: AiAnalysis | null;
  onDecision: (
    decision: "APPROVED" | "REJECTED" | "ESCALATED",
    rationale: string
  ) => Promise<void>;
}

const DECISION_TO_AI_REC: Record<string, string> = {
  APPROVED:  "APPROVE",
  REJECTED:  "REJECT",
  ESCALATED: "ESCALATE",
};

const LOW_CONFIDENCE_THRESHOLD = 60;

export function DecisionPanel({ selectedCase, analysis, onDecision }: DecisionPanelProps) {
  const [rationale, setRationale] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [overridePopup, setOverridePopup] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<"APPROVED" | "REJECTED" | "ESCALATED" | null>(null);
  const rationaleRef = useRef(rationale);
  rationaleRef.current = rationale;

  useEffect(() => {
    function onDecisionEvent(e: Event) {
      const decision = (e as CustomEvent<string>).detail as
        "APPROVED" | "REJECTED" | "ESCALATED";
      if (rationaleRef.current.trim().length >= 10 && !pending) {
        void handleDecision(decision);
      }
    }
    document.addEventListener("bankops:decision", onDecisionEvent);
    return () => document.removeEventListener("bankops:decision", onDecisionEvent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const isActionable =
    selectedCase &&
    (selectedCase.status === "PENDING" || selectedCase.status === "UNDER_REVIEW");

  const canSubmit = rationale.trim().length >= 10 && !pending;

  const isLowConfidence =
    analysis !== null && analysis.confidencePercent < LOW_CONFIDENCE_THRESHOLD;

  function isOverride(decision: string): boolean {
    if (!analysis) return false;
    const aiImplied = DECISION_TO_AI_REC[decision];
    return (
      aiImplied !== undefined &&
      analysis.recommendation !== "NEEDS_MORE_INFO" &&
      analysis.recommendation !== aiImplied
    );
  }

  async function handleDecision(decision: "APPROVED" | "REJECTED" | "ESCALATED") {
    if (!canSubmit) return;

    // If this is an override, show popup and wait for confirmation
    if (isOverride(decision)) {
      setPendingDecision(decision);
      setOverridePopup(true);
      return;
    }

    await submitDecision(decision);
  }

  async function submitDecision(decision: "APPROVED" | "REJECTED" | "ESCALATED") {
    setPending(decision);
    try {
      await onDecision(decision, rationale.trim());
      setRationale("");
    } finally {
      setPending(null);
      setOverridePopup(false);
      setPendingDecision(null);
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

      {/* Low confidence warning */}
      {isLowConfidence && (
        <div className="flex items-start gap-2 rounded-md border border-amber-700/50 bg-amber-900/20 px-3 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden />
          <p className="text-xs text-amber-300">
            AI confidence is low ({analysis!.confidencePercent}%). Additional review
            is recommended before deciding.
          </p>
        </div>
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
        {(["APPROVED", "REJECTED", "ESCALATED"] as const).map((decision) => (
          <button
            key={decision}
            onClick={() => handleDecision(decision)}
            disabled={!canSubmit}
            className={`
              flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2
              text-sm font-semibold transition-colors
              disabled:cursor-not-allowed disabled:opacity-50
              ${decision === "APPROVED"  ? "bg-brand-600 text-white hover:bg-brand-700" : ""}
              ${decision === "REJECTED"  ? "bg-red-700 text-white hover:bg-red-600" : ""}
              ${decision === "ESCALATED" ? "border border-border text-slate-300 hover:bg-white/10" : ""}
            `}
          >
            {pending === decision ? (
              <Spinner size="sm" />
            ) : (
              decision.charAt(0) + decision.slice(1).toLowerCase()
            )}
          </button>
        ))}
      </div>
      
      {/* Override confirmation popup */}
      {overridePopup && pendingDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-lg border border-orange-700/50 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-400" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Override AI Recommendation</h3>
                <p className="mt-1 text-xs text-slate-400">
                  This decision contradicts the AI recommendation. It will be logged
                  as a <strong className="text-slate-300">DECISION_OVERRIDE</strong> in
                  the audit trail.
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setOverridePopup(false); setPendingDecision(null); }}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-slate-400 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => submitDecision(pendingDecision)}
                className="rounded-md bg-orange-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600"
              >
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}