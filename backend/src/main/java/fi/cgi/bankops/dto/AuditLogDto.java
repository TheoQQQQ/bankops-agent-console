package fi.cgi.bankops.dto;

import java.time.Instant;

/** Read-only projection of an audit log entry. */
public record AuditLogDto(
        Long id,
        Long caseId,
        String actor,
        String action,
        String detail,
        Instant createdAt
) {}
