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
import java.util.Map;
import java.util.Set;

/**
 * Core business logic for case lifecycle management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private static final Set<CaseStatus> ACTIONABLE_STATUSES =
            Set.of(CaseStatus.PENDING, CaseStatus.UNDER_REVIEW);

    private static final Set<CaseStatus> TERMINAL_STATUSES =
            Set.of(CaseStatus.APPROVED, CaseStatus.REJECTED, CaseStatus.ESCALATED);

    /**
     * Maps an AI recommendation string to the CaseStatus it implies.
     * Used for override detection.
     */
    private static final Map<String, CaseStatus> AI_REC_TO_STATUS = Map.of(
            "APPROVE",         CaseStatus.APPROVED,
            "REJECT",          CaseStatus.REJECTED,
            "ESCALATE",        CaseStatus.ESCALATED
            // NEEDS_MORE_INFO has no direct mapping – never triggers override
    );

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
        findOrThrow(caseId);
        return auditLogRepository.findByCaseIdOrderByCreatedAtAsc(caseId)
                .stream()
                .map(caseMapper::toAuditDto)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Commands
    // -------------------------------------------------------------------------

    @Transactional
    public CustomerCaseDto recordAiAnalysis(Long caseId, AiAnalysisRequest request) {
        var cs = findOrThrow(caseId);

        if (cs.getStatus() == CaseStatus.PENDING) {
            cs.setStatus(CaseStatus.UNDER_REVIEW);
        }

        auditService.record(caseId, "AI_AGENT", "AI_ANALYSED", buildAiDetail(request));

        log.info("AI analysis recorded for case {} (confidence={}%)",
                cs.getCaseRef(), request.confidencePercent());

        return caseMapper.toDto(caseRepository.save(cs));
    }

    /**
     * Applies an operator decision to a case.
     *
     * <p>If the operator's decision contradicts the AI recommendation,
     * an additional {@code DECISION_OVERRIDE} audit entry is written.
     * This satisfies EBA/EU AI Act requirements for human-override logging
     * in automated decision-support systems.</p>
     */
    @Transactional
    public CustomerCaseDto applyDecision(Long caseId, DecisionRequest request) {
        var cs = findOrThrow(caseId);

        validateTransition(cs, request.decision());

        cs.setStatus(request.decision());

        String actor  = "OPERATOR:" + request.operator();
        String detail = request.decision() + " – " + request.rationale();
        auditService.record(caseId, actor, request.decision().name(), detail);

        // Override detection
        if (isOverride(request)) {
            String overrideDetail = buildOverrideDetail(request);
            auditService.record(caseId, actor, "DECISION_OVERRIDE", overrideDetail);
            log.warn("Override detected on case {}: AI recommended {} but operator chose {}",
                    cs.getCaseRef(), request.aiRecommendation(), request.decision());
        }

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

    /**
     * An override occurs when:
     * - an AI recommendation was provided, AND
     * - it maps to a concrete status, AND
     * - that status differs from the operator's decision.
     */
    private static boolean isOverride(DecisionRequest request) {
        if (request.aiRecommendation() == null || request.aiRecommendation().isBlank()) {
            return false;
        }
        CaseStatus impliedStatus = AI_REC_TO_STATUS.get(request.aiRecommendation());
        return impliedStatus != null && impliedStatus != request.decision();
    }

    private static String buildOverrideDetail(DecisionRequest request) {
        return ("AI recommended %s but operator chose %s. Operator rationale: %s")
                .formatted(
                        request.aiRecommendation(),
                        request.decision(),
                        request.rationale()
                );
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
