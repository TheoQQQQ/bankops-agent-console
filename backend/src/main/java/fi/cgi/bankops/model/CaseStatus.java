package fi.cgi.bankops.model;

/** Lifecycle status of a customer case. */
public enum CaseStatus {
    PENDING,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    ESCALATED
}
