package fi.cgi.bankops.dto;

import fi.cgi.bankops.model.CaseStatus;
import fi.cgi.bankops.model.CaseType;
import fi.cgi.bankops.model.RiskLevel;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Read-only view of a customer case exposed via the REST API.
 * Using a record ensures immutability and eliminates boilerplate.
 */
public record CustomerCaseDto(
        Long id,
        String caseRef,
        String customerId,
        String customerName,
        CaseType caseType,
        CaseStatus status,
        RiskLevel riskLevel,
        BigDecimal amount,
        String description,
        Instant createdAt,
        Instant updatedAt,
        Instant dueAt,
        boolean slaBreached
) {}