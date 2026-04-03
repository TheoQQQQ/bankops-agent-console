package fi.cgi.bankops.service;

import fi.cgi.bankops.audit.AuditService;
import fi.cgi.bankops.dto.*;
import fi.cgi.bankops.exception.CaseNotFoundException;
import fi.cgi.bankops.exception.InvalidStateTransitionException;
import fi.cgi.bankops.model.*;
import fi.cgi.bankops.repository.AuditLogRepository;
import fi.cgi.bankops.repository.CustomerCaseRepository;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseService {

    private static final Set<CaseStatus> ACTIONABLE_STATUSES =
            Set.of(CaseStatus.PENDING, CaseStatus.UNDER_REVIEW);

    private static final Set<CaseStatus> TERMINAL_STATUSES =
            Set.of(CaseStatus.APPROVED, CaseStatus.REJECTED, CaseStatus.ESCALATED);

    private static final Map<String, CaseStatus> AI_REC_TO_STATUS = Map.of(
            "APPROVE",  CaseStatus.APPROVED,
            "REJECT",   CaseStatus.REJECTED,
            "ESCALATE", CaseStatus.ESCALATED
    );

    private final CustomerCaseRepository caseRepository;
    private final AuditLogRepository     auditLogRepository;
    private final AuditService           auditService;
    private final CaseMapper             caseMapper;

    @Transactional(readOnly = true)
    public Page<CustomerCaseDto> getActiveCases(Pageable pageable) {
        return caseRepository
                .findActiveCasesPaginated(CaseStatus.PENDING, CaseStatus.UNDER_REVIEW, pageable)
                .map(caseMapper::toDto);
    }

    @Transactional(readOnly = true)
    public CustomerCaseDto getCaseById(@NonNull Long id) {
        return caseMapper.toDto(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLog(@NonNull Long caseId) {
        findOrThrow(caseId);
        return auditLogRepository.findByCaseIdOrderByCreatedAtAsc(caseId)
                .stream()
                .map(caseMapper::toAuditDto)
                .toList();
    }

    @Transactional
    public CustomerCaseDto recordAiAnalysis(@NonNull Long caseId, AiAnalysisRequest request) {
        var cs = findOrThrow(caseId);

        if (cs.getStatus() == CaseStatus.PENDING) {
            cs.setStatus(CaseStatus.UNDER_REVIEW);
        }

        auditService.record(caseId, "AI_AGENT", "AI_ANALYSED", buildAiDetail(request));

        log.info("AI analysis recorded for case {} (confidence={}%)",
                cs.getCaseRef(), request.confidencePercent());

        return caseMapper.toDto(caseRepository.save(cs));
    }

    @Transactional
    public CustomerCaseDto applyDecision(@NonNull Long caseId, DecisionRequest request) {
        var cs = findOrThrow(caseId);

        validateTransition(cs, request.decision());
        cs.setStatus(request.decision());

        String actor  = "OPERATOR:" + sanitise(request.operator());
        String detail = request.decision() + " – " + sanitise(request.rationale());
        auditService.record(caseId, actor, request.decision().name(), detail);

        if (isOverride(request)) {
            String overrideDetail = buildOverrideDetail(request);
            auditService.record(caseId, actor, "DECISION_OVERRIDE", overrideDetail);
            log.warn("Override on case {}: AI={} Operator={}",
                    cs.getCaseRef(), request.aiRecommendation(), request.decision());
        }

        log.info("Decision {} on case {} by {}",
                request.decision(), cs.getCaseRef(), request.operator());

        return caseMapper.toDto(caseRepository.save(cs));
    }

    private CustomerCase findOrThrow(@NonNull Long id) {
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

    private static boolean isOverride(DecisionRequest request) {
        if (request.aiRecommendation() == null || request.aiRecommendation().isBlank()) {
            return false;
        }
        CaseStatus implied = AI_REC_TO_STATUS.get(request.aiRecommendation());
        return implied != null && implied != request.decision();
    }

    private static String sanitise(String input) {
        if (input == null) return null;
        String stripped = input.replaceAll("<[^>]*>", "");
        return stripped.replaceAll("[\\p{Cntrl}&&[^\t\n\r]]", "");
    }

    private static String buildOverrideDetail(DecisionRequest r) {
        return "AI recommended %s but operator chose %s. Rationale: %s"
                .formatted(r.aiRecommendation(), r.decision(), sanitise(r.rationale()));
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