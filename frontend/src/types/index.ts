// ============================================================
// Domain types – mirror the Java backend DTOs exactly.
// Keeping them in one file makes API contract changes easy to spot.
// ============================================================

export type CaseType = "FRAUD_ALERT" | "KYC_REVIEW" | "CREDIT_LIMIT" | "AML_FLAG";
export type CaseStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "ESCALATED";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CustomerCase {
  id: number;
  caseRef: string;
  customerId: string;
  customerName: string;
  caseType: CaseType;
  status: CaseStatus;
  riskLevel: RiskLevel;
  amount: number | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  slaBreached: boolean;
}

export interface AuditEntry {
  id: number;
  caseId: number;
  actor: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

// ============================================================
// AI layer types
// ============================================================

export interface AiAnalysis {
  riskAssessment: string;
  summary: string;
  recommendation: "APPROVE" | "REJECT" | "ESCALATE" | "NEEDS_MORE_INFO";
  confidencePercent: number;
  reasoning: string;
}

export interface AiAnalysisRequest {
  riskAssessment: string;
  summary: string;
  recommendation: string;
  confidencePercent: number;
  reasoning?: string;
  resilienceMode?: boolean;
}

export interface DecisionRequest {
  decision: "APPROVED" | "REJECTED" | "ESCALATED";
  operator: string;
  rationale: string;
  /** AI recommendation at time of decision — used for override detection. */
  aiRecommendation?: string;
}

export interface NoteRequest {
  note: string;
  operator: string;
}

// ============================================================
// UI state types
// ============================================================

export type AgentStatus =
  | "idle"
  | "fetching"
  | "analysing"
  | "done"
  | "error";

export type SortField =
  | "createdAt"
  | "riskLevel"
  | "amount"
  | "customerName";

export type SortDirection = "asc" | "desc";

export interface CaseFilters {
  search: string;
  riskLevel: RiskLevel | "ALL";
  caseType: CaseType | "ALL";
  sortField: SortField;
  sortDirection: SortDirection;
}