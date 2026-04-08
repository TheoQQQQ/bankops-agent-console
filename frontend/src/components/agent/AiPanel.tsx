"use client";

import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import type { AgentStatus, AiAnalysis, CustomerCase } from "@/types";
import { riskBadgeBg } from "@/lib/utils";
import { Bot, CheckCircle2, XCircle, AlertCircle, HelpCircle, WifiOff } from "lucide-react";

interface AiPanelProps {
  status: AgentStatus;
  analysis: AiAnalysis | null;
  error: string | null;
  onAnalyse: () => void;
  selectedCase: CustomerCase | null;
}

const recommendationConfig = {
  APPROVE:        { icon: CheckCircle2, colour: "text-emerald-400", label: "Recommend Approve" },
  REJECT:         { icon: XCircle,      colour: "text-red-400",     label: "Recommend Reject" },
  ESCALATE:       { icon: AlertCircle,  colour: "text-purple-400",  label: "Escalate" },
  NEEDS_MORE_INFO:{ icon: HelpCircle,   colour: "text-amber-400",   label: "Needs More Info" },
} as const;

export function AiPanel({ status, analysis, error, onAnalyse, selectedCase }: AiPanelProps) {
  const isIdle     = status === "idle";
  const isLoading  = status === "fetching" || status === "analysing";
  const isDone     = status === "done" && analysis !== null;
  const isError    = status === "error";

  const rec = analysis ? recommendationConfig[analysis.recommendation] : null;

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-500" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-200">AI Analysis Agent</h2>
          {isLoading && <Spinner size="sm" className="text-brand-400" />}
        </div>
        <button
          onClick={onAnalyse}
          disabled={!selectedCase || isLoading}
          className="btn-primary py-1.5 text-xs"
        >
          {isLoading ? "Analysing…" : "Run Analysis"}
        </button>
      </div>

      {/* Idle state */}
      {isIdle && (
        <p className="text-sm text-slate-500">
          Select a case from the list and click <strong>Run Analysis</strong> to
          invoke the AI agent.
        </p>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-6 text-slate-400">
          <Spinner size="lg" className="text-brand-500" />
          <p className="text-sm">
            {status === "fetching" ? "Fetching case data…" : "AI agent is analysing…"}
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Done state */}
      {isDone && analysis && rec && (
        <div className="flex flex-col gap-4">

          {/* Resilience mode warning banner */}
          {analysis.resilienceMode && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
              <WifiOff className="h-4 w-4 flex-shrink-0 text-amber-400" aria-hidden />
              <p className="text-xs text-amber-300">
                AI service unavailable — fallback mode. Proceed with manual review.
              </p>
            </div>
          )}

          {/* Recommendation header */}
          <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
            <rec.icon className={`h-5 w-5 flex-shrink-0 ${rec.colour}`} aria-hidden />
            <div>
              <p className="text-xs text-slate-500">AI Recommendation</p>
              <p className={`text-sm font-bold ${rec.colour}`}>{rec.label}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500">Confidence</p>
              <p className="text-sm font-bold text-slate-200">{analysis.confidencePercent}%</p>
            </div>
            <Badge className={riskBadgeBg(analysis.riskAssessment)}>
              {analysis.riskAssessment}
            </Badge>
          </div>

          {/* Summary */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Summary
            </h3>
            <p className="text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
          </div>

          {/* Reasoning */}
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reasoning
            </h3>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-400">
              {analysis.reasoning}
            </pre>
          </div>

          <p className="text-xs text-slate-600">
            This is an AI-generated analysis. Final decision rests with the operator.
          </p>
        </div>
      )}
    </div>
  );
}