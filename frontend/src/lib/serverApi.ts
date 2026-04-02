/**
 * Server-side API client – used ONLY in Next.js Route Handlers and
 * Server Components. Calls the Java backend directly (not through
 * the browser-facing proxy) using BACKEND_URL env var.
 *
 * Never import this file in client components.
 */

import type {
  AiAnalysisRequest,
  AuditEntry,
  CustomerCase,
  DecisionRequest,
} from "@/types";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";
const API = `${BACKEND}/api/v1`;

async function serverRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Disable Next.js fetch caching for live banking data
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    let message = `Backend error: HTTP ${res.status}`;
    try {
      const body = await res.json() as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const serverGetActiveCases = (): Promise<CustomerCase[]> =>
  serverRequest<CustomerCase[]>("/cases/active");

export const serverGetCase = (id: number): Promise<CustomerCase> =>
  serverRequest<CustomerCase>(`/cases/${id}`);

export const serverGetAuditLog = (caseId: number): Promise<AuditEntry[]> =>
  serverRequest<AuditEntry[]>(`/cases/${caseId}/audit`);

export const postAiAnalysis = (
  caseId: number,
  body: AiAnalysisRequest
): Promise<CustomerCase> =>
  serverRequest<CustomerCase>(`/cases/${caseId}/ai-analysis`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const postDecision = (
  caseId: number,
  body: DecisionRequest
): Promise<CustomerCase> =>
  serverRequest<CustomerCase>(`/cases/${caseId}/decision`, {
    method: "POST",
    body: JSON.stringify(body),
  });
