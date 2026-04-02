package fi.cgi.bankops.repository;

import fi.cgi.bankops.model.CaseStatus;
import fi.cgi.bankops.model.CustomerCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerCaseRepository extends JpaRepository<CustomerCase, Long> {

    Optional<CustomerCase> findByCaseRef(String caseRef);

    List<CustomerCase> findByStatusOrderByCreatedAtAsc(CaseStatus status);

    /**
     * Returns all cases that still require operator attention,
     * ordered so that the most critical and oldest appear first.
     *
     * <p>Uses typed enum parameters via :pending / :underReview to avoid
     * string-literal comparisons that break if enum names are refactored.</p>
     */
    @Query("""
            SELECT c FROM CustomerCase c
            WHERE c.status IN (:pending, :underReview)
            ORDER BY
                CASE c.riskLevel
                    WHEN fi.cgi.bankops.model.RiskLevel.CRITICAL THEN 1
                    WHEN fi.cgi.bankops.model.RiskLevel.HIGH     THEN 2
                    WHEN fi.cgi.bankops.model.RiskLevel.MEDIUM   THEN 3
                    WHEN fi.cgi.bankops.model.RiskLevel.LOW      THEN 4
                END ASC,
                c.createdAt ASC
            """)
    List<CustomerCase> findActiveCasesOrderedByPriority(
            @Param("pending")      CaseStatus pending,
            @Param("underReview")  CaseStatus underReview
    );

    /** Convenience overload with defaults. */
    default List<CustomerCase> findActiveCasesOrderedByPriority() {
        return findActiveCasesOrderedByPriority(CaseStatus.PENDING, CaseStatus.UNDER_REVIEW);
    }
}
