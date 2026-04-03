package fi.cgi.bankops.audit;

import fi.cgi.bankops.model.AuditLog;
import fi.cgi.bankops.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(@Nullable Long caseId, String actor, String action, String detail) {
        var entry = AuditLog.builder()
                .caseId(caseId)
                .actor(actor)
                .action(action)
                .detail(truncate(detail, 4000))
                .build();
        auditLogRepository.save(entry);
    }

    private static String truncate(String text, int maxLength) {
        if (text == null) return null;
        return text.length() <= maxLength ? text : text.substring(0, maxLength - 3) + "...";
    }
}