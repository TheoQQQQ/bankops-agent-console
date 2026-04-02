package fi.cgi.bankops.service;

import fi.cgi.bankops.audit.AuditService;
import fi.cgi.bankops.dto.*;
import fi.cgi.bankops.exception.CaseNotFoundException;
import fi.cgi.bankops.exception.InvalidStateTransitionException;
import fi.cgi.bankops.model.*;
import fi.cgi.bankops.repository.AuditLogRepository;
import fi.cgi.bankops.repository.CustomerCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Core business logic for case lifecycle management.
 *
 * <p>All write operations are wrapped in a transaction; the {@link AuditService}
 * uses {@code REQUIRES_NEW} so its writes survive any rollback here.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    /** Only these statuses may receive a new decision. */
    private static final Set<CaseStatus> ACTIONABLE_STATUSES =
            Set.of(CaseStatus.PENDING, CaseStatus.UNDER_REVIEW);

    /** Only terminal statuses are accepted as decisions. */
    private static final Set<CaseStatus> TERMINAL_STATUSES =
            Set.of(CaseStatus.APPROVED, CaseStatus.REJECTED, CaseStatus.ESCALATED);

    private final CustomerCaseRepository caseRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditService auditService;
    private final CaseMapper caseMapper;

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CustomerCaseDto> getActiveCases() {
        return caseRepository.findActiveCasesOrderedByPriority()
                .stream()
                .map(caseMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerCaseDto getCaseById(Long id) {
        return caseMapper.toDto(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLog(Long caseId) {
        // Verify case exists before returning its audit trail
        findOrThrow(caseId);
        return auditLogRepository.findByCaseIdOrderByCreatedAtAsc(caseId)
                .stream()
                .map(caseMapper::toAuditDto)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Commands
    // -------------------------------------------------------------------------

    /**
     * Marks a case as being reviewed and records the AI's analysis.
     */
    @Transactional
    public CustomerCaseDto recordAiAnalysis(Long caseId, AiAnalysisRequest request) {
        var cs = findOrThrow(caseId);

        if (cs.getStatus() == CaseStatus.PENDING) {
            cs.setStatus(CaseStatus.UNDER_REVIEW);
        }

        String detail = buildAiDetail(request);
        auditService.record(caseId, "AI_AGENT", "AI_ANALYSED", detail);

        log.info("AI analysis recorded for case {} (confidence={}%)",
                cs.getCaseRef(), request.confidencePercent());

        return caseMapper.toDto(caseRepository.save(cs));
    }

    /**
     * Applies an operator decision to a case.
     *
     * @throws InvalidStateTransitionException if the case is not in an actionable state
     *         or the requested status is not a terminal decision.
     */
    @Transactional
    public CustomerCaseDto applyDecision(Long caseId, DecisionRequest request) {
        var cs = findOrThrow(caseId);

        validateTransition(cs, request.decision());

        cs.setStatus(request.decision());

        String actor = "OPERATOR:" + request.operator();
        String detail = request.decision() + " – " + request.rationale();
        auditService.record(caseId, actor, request.decision().name(), detail);

        log.info("Decision {} applied to case {} by {}",
                request.decision(), cs.getCaseRef(), request.operator());

        return caseMapper.toDto(caseRepository.save(cs));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private CustomerCase findOrThrow(Long id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new CaseNotFoundException(id));
    }

    private void validateTransition(CustomerCase cs, CaseStatus newStatus) {
        if (!ACTIONABLE_STATUSES.contains(cs.getStatus())) {
            throw new InvalidStateTransitionException(
                    "Case %s is already in terminal state %s"
                            .formatted(cs.getCaseRef(), cs.getStatus()));
        }
        if (!TERMINAL_STATUSES.contains(newStatus)) {
            throw new InvalidStateTransitionException(
                    "Status %s is not a valid decision. Allowed: %s"
                            .formatted(newStatus, TERMINAL_STATUSES));
        }
    }

    private static String buildAiDetail(AiAnalysisRequest r) {
        return """
                Risk Assessment: %s
                Recommendation:  %s
                Confidence:      %d%%
                Summary:         %s
                """.formatted(r.riskAssessment(), r.recommendation(),
                r.confidencePercent(), r.summary());
    }
}
