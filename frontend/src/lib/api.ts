/**
 * Typed API client for the BankOps Java backend.
 *
 * All requests go through Next.js rewrites (/api/backend/*).
 * The JWT is stored in an HttpOnly cookie, so it is forwarded
 * automatically by the browser on every same-origin request —
 * no manual Authorization header needed from client components.
 */

import type {
  AiAnalysisRequest,
  AuditEntry,
  CustomerCase,
  DecisionRequest,
  NoteRequest,
} from "@/types";

const BASE = "/api/backend";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    // Include cookies so the Next.js rewrite can forward the JWT
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      // Token expired or missing — redirect to login
      window.location.href = "/login";
      throw new Error("Session expired");
    }
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json() as { detail?: string };
      message = body.detail ?? message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ----------------------------------------------------------------
// Cases
// ----------------------------------------------------------------

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const getActiveCases = (
  page = 0,
  size = 20
): Promise<PagedResponse<CustomerCase>> =>
  request<PagedResponse<CustomerCase>>(
    `/cases/active?page=${page}&size=${size}`
  );

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

export const postNote = (
  caseId: number,
  body: NoteRequest
): Promise<CustomerCase> =>
  request<CustomerCase>(`/cases/${caseId}/note`, {
    method: "POST",
    body: JSON.stringify(body),
  });