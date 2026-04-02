"use client";

import { formatDate } from "@/lib/utils";
import type { AuditEntry } from "@/types";
import { Bot, User } from "lucide-react";

interface AuditTimelineProps {
  entries: AuditEntry[];
}

function ActorIcon({ actor }: { actor: string }) {
  if (actor === "AI_AGENT") {
    return <Bot className="h-4 w-4 text-brand-400" aria-hidden />;
  }
  return <User className="h-4 w-4 text-slate-400" aria-hidden />;
}

function formatActor(actor: string): string {
  if (actor === "AI_AGENT") return "AI Agent";
  return actor.replace("OPERATOR:", "");
}

/**
 * Chronological audit trail displayed as a vertical timeline.
 * Each entry clearly shows who acted, what they did, and when.
 */
export function AuditTimeline({ entries }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">No audit events recorded yet.</p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-0">
      {entries.map((entry, idx) => (
        <li key={entry.id} className="flex gap-3">
          {/* Timeline stem */}
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-panel">
              <ActorIcon actor={entry.actor} />
            </div>
            {idx < entries.length - 1 && (
              <div className="w-px flex-1 bg-border" />
            )}
          </div>

          {/* Content */}
          <div className="pb-5 min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-200">
                {formatActor(entry.actor)}
              </span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-400">
                {entry.action}
              </span>
              <span className="text-xs text-slate-600">{formatDate(entry.createdAt)}</span>
            </div>
            {entry.detail && (
              <pre className="mt-1.5 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-400">
                {entry.detail}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
