package fi.cgi.bankops.service;

import fi.cgi.bankops.dto.AuditLogDto;
import fi.cgi.bankops.dto.CustomerCaseDto;
import fi.cgi.bankops.model.AuditLog;
import fi.cgi.bankops.model.CaseStatus;
import fi.cgi.bankops.model.CustomerCase;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;

/**
 * Manual mapper replacing MapStruct to avoid annotation-processor
 * compatibility issues with Java 21 and Lombok.
 */
@Service
public class CaseMapper {

    /** SLA window: 48 hours from case creation. */
    private static final long SLA_HOURS = 48;

    /** Only active statuses can breach SLA — terminal cases are already resolved. */
    private static final Set<CaseStatus> ACTIVE_STATUSES =
            Set.of(CaseStatus.PENDING, CaseStatus.UNDER_REVIEW);

    public CustomerCaseDto toDto(CustomerCase e) {
        Instant dueAt = e.getCreatedAt().plus(SLA_HOURS, ChronoUnit.HOURS);
        boolean slaBreached = ACTIVE_STATUSES.contains(e.getStatus())
                && Instant.now().isAfter(dueAt);

        return new CustomerCaseDto(
                e.getId(),
                e.getCaseRef(),
                e.getCustomerId(),
                e.getCustomerName(),
                e.getCaseType(),
                e.getStatus(),
                e.getRiskLevel(),
                e.getAmount(),
                e.getDescription(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                dueAt,
                slaBreached
        );
    }

    public AuditLogDto toAuditDto(AuditLog e) {
        return new AuditLogDto(
                e.getId(),
                e.getCaseId(),
                e.getActor(),
                e.getAction(),
                e.getDetail(),
                e.getCreatedAt()
        );
    }
}