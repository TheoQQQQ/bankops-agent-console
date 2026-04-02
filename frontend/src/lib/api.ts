/**
 * Typed API client for the BankOps Java backend.
 *
 * All requests go through Next.js rewrites (/api/backend/*) so the
 * browser never talks directly to the Java service.
 */

import type {
  AiAnalysisRequest,
  AuditEntry,
  CustomerCase,
  DecisionRequest,
} from "@/types";

const BASE = "/api/backend";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    // Attempt to parse RFC 7807 Problem Detail
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // non-JSON error body – keep the status code message
    }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ----------------------------------------------------------------
// Cases
// ----------------------------------------------------------------

export const getActiveCases = (): Promise<CustomerCase[]> =>
  request<CustomerCase[]>("/cases/active");

export const getCase = (id: number): Promise<CustomerCase> =>
  request<CustomerCase>(`/cases/${id}`);

export const getAuditLog = (caseId: number): Promise<AuditEntry[]> =>
  request<AuditEntry[]>(`/cases/${caseId}/audit`);

export const postAiAnalysis = (
  caseId: number,
  body: AiAnalysisRequest
): Promise<CustomerCase> =>
  request<CustomerCase>(`/cases/${caseId}/ai-analysis`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const postDecision = (
  caseId: number,
  body: DecisionRequest
): Promise<CustomerCase> =>
  request<CustomerCase>(`/cases/${caseId}/decision`, {
    method: "POST",
    body: JSON.stringify(body),
  });
