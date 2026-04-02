package fi.cgi.bankops.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Persistent entity representing a single customer case in the
 * (simulated) legacy core-banking system.
 *
 * <p>Immutable fields (caseRef, customerId, createdAt) are never updated
 * after creation, enforcing append-only semantics for compliance.</p>
 */
@Entity
@Table(name = "customer_case")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable, externally referenceable case identifier. */
    @Column(name = "case_ref", nullable = false, unique = true, updatable = false, length = 20)
    private String caseRef;

    @Column(name = "customer_id", nullable = false, updatable = false, length = 20)
    private String customerId;

    @Column(name = "customer_name", nullable = false, length = 120)
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(name = "case_type", nullable = false, length = 30)
    private CaseType caseType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CaseStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 10)
    private RiskLevel riskLevel;

    /** Monetary amount involved; nullable for non-financial cases. */
    @Column(precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
