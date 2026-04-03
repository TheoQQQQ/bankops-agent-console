package fi.cgi.bankops.repository;

import fi.cgi.bankops.model.CaseStatus;
import fi.cgi.bankops.model.CustomerCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerCaseRepository extends JpaRepository<CustomerCase, Long> {

    Optional<CustomerCase> findByCaseRef(String caseRef);

    boolean existsByCaseRef(String caseRef);

    List<CustomerCase> findByStatusOrderByCreatedAtAsc(CaseStatus status);

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
    Page<CustomerCase> findActiveCasesPaginated(
            @Param("pending")     CaseStatus pending,
            @Param("underReview") CaseStatus underReview,
            Pageable pageable
    );

    default List<CustomerCase> findActiveCasesOrderedByPriority() {
        return findActiveCasesPaginated(
                CaseStatus.PENDING,
                CaseStatus.UNDER_REVIEW,
                Pageable.unpaged()
        ).getContent();
    }
}