package fi.cgi.bankops.model;

/** Classifies the nature of a customer case. */
public enum CaseType {
    FRAUD_ALERT,
    KYC_REVIEW,
    CREDIT_LIMIT,
    AML_FLAG
}
