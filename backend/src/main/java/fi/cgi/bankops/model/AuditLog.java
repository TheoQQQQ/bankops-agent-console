package fi.cgi.bankops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Immutable audit record.
 *
 * <p>Every significant action – by a human operator or the AI agent –
 * is persisted here. No update or delete operations are permitted
 * (enforced at the service layer). This satisfies financial-sector
 * audit-trail requirements.</p>
 */
@Entity
@Table(name = "audit_log")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Optional reference to the related case. Nullable so that
     * system-level events (e.g. login) can also be logged here
     * without requiring a case context.
     */
    @Column(name = "case_id")
    private Long caseId;

    /**
     * Who performed the action.
     * Convention: {@code "OPERATOR:<username>"} or {@code "AI_AGENT"}.
     */
    @Column(nullable = false, length = 60)
    private String actor;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String detail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
