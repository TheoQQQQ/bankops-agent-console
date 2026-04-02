package fi.cgi.bankops.audit;

import fi.cgi.bankops.model.AuditLog;
import fi.cgi.bankops.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Centralised audit-logging service.
 *
 * <p>Uses {@code REQUIRES_NEW} propagation so that audit entries are
 * always persisted, even if the calling transaction is rolled back.
 * This ensures compliance with financial-sector record-keeping rules.</p>
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Records an audit event.
     *
     * @param caseId  the related case ID (nullable for system-level events)
     * @param actor   who triggered the event, e.g. {@code "OPERATOR:jsmith"} or {@code "AI_AGENT"}
     * @param action  short action code, e.g. {@code "APPROVED"}
     * @param detail  human-readable detail text (max 4 000 characters)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long caseId, String actor, String action, String detail) {
        var entry = AuditLog.builder()
                .caseId(caseId)
                .actor(actor)
                .action(action)
                .detail(truncate(detail, 4000))
                .build();
        auditLogRepository.save(entry);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /** Prevents accidental oversized inserts without throwing. */
    private static String truncate(String text, int maxLength) {
        if (text == null) return null;
        return text.length() <= maxLength ? text : text.substring(0, maxLength - 3) + "...";
    }
}
