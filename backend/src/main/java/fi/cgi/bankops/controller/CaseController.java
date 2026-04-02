package fi.cgi.bankops.controller;

import fi.cgi.bankops.dto.*;
import fi.cgi.bankops.service.CaseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for customer case operations.
 *
 * <p>All endpoints are prefixed with {@code /api/v1/cases}.
 * The controller is intentionally thin – it delegates all logic
 * to {@link CaseService} and only handles HTTP concerns here.</p>
 */
@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService caseService;

    /**
     * Returns all cases that require operator attention, ordered by priority.
     * GET /api/v1/cases/active
     */
    @GetMapping("/active")
    public List<CustomerCaseDto> getActiveCases() {
        return caseService.getActiveCases();
    }

    /**
     * Returns a single case by its internal ID.
     * GET /api/v1/cases/{id}
     */
    @GetMapping("/{id}")
    public CustomerCaseDto getCase(@PathVariable Long id) {
        return caseService.getCaseById(id);
    }

    /**
     * Returns the full audit trail for a case.
     * GET /api/v1/cases/{id}/audit
     */
    @GetMapping("/{id}/audit")
    public List<AuditLogDto> getAuditLog(@PathVariable Long id) {
        return caseService.getAuditLog(id);
    }

    /**
     * Records the AI agent's analysis of a case.
     * POST /api/v1/cases/{id}/ai-analysis
     */
    @PostMapping("/{id}/ai-analysis")
    public CustomerCaseDto recordAiAnalysis(
            @PathVariable Long id,
            @Valid @RequestBody AiAnalysisRequest request) {
        return caseService.recordAiAnalysis(id, request);
    }

    /**
     * Applies an operator decision (APPROVED / REJECTED / ESCALATED).
     * POST /api/v1/cases/{id}/decision
     */
    @PostMapping("/{id}/decision")
    public CustomerCaseDto applyDecision(
            @PathVariable Long id,
            @Valid @RequestBody DecisionRequest request) {
        return caseService.applyDecision(id, request);
    }

    /**
     * Health check – useful for container readiness probes.
     * GET /api/v1/cases/health
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
