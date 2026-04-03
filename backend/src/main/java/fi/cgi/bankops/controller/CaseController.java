package fi.cgi.bankops.controller;

import fi.cgi.bankops.dto.*;
import fi.cgi.bankops.service.CaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for customer case operations.
 *
 * <p>All endpoints require a valid JWT bearer token
 * (configured in {@link fi.cgi.bankops.config.SecurityConfig}).</p>
 */
@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
@Validated
@Tag(name = "Cases", description = "Customer case lifecycle management")
@SecurityRequirement(name = "bearerAuth")
public class CaseController {

    private final CaseService caseService;

    /**
     * Returns paginated active cases, ordered by risk priority.
     * GET /api/v1/cases/active?page=0&size=20
     */
    @GetMapping("/active")
    @Operation(
        summary     = "List active cases",
        description = "Returns paginated cases in PENDING or UNDER_REVIEW status, " +
                      "sorted by risk level (CRITICAL first) then creation date."
    )
    public Page<CustomerCaseDto> getActiveCases(
            @Parameter(description = "Zero-based page index") @RequestParam(defaultValue = "0")
            @Min(0) int page,

            @Parameter(description = "Page size (max 100)") @RequestParam(defaultValue = "20")
            @Min(1) @Max(100) int size
    ) {
        return caseService.getActiveCases(PageRequest.of(page, size));
    }

    /**
     * Returns a single case by its internal ID.
     * GET /api/v1/cases/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get case by ID")
    public CustomerCaseDto getCase(@PathVariable Long id) {
        return caseService.getCaseById(id);
    }

    /**
     * Returns the full audit trail for a case.
     * GET /api/v1/cases/{id}/audit
     */
    @GetMapping("/{id}/audit")
    @Operation(summary = "Get audit trail", description = "Returns all audit entries for a case in chronological order.")
    public List<AuditLogDto> getAuditLog(@PathVariable Long id) {
        return caseService.getAuditLog(id);
    }

    /**
     * Records the AI agent's analysis of a case.
     * POST /api/v1/cases/{id}/ai-analysis
     */
    @PostMapping("/{id}/ai-analysis")
    @Operation(summary = "Record AI analysis", description = "Persists the AI agent's risk assessment to the audit log.")
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
    @Operation(summary = "Submit operator decision", description = "Applies a terminal decision to a case and logs it.")
    public CustomerCaseDto applyDecision(
            @PathVariable Long id,
            @Valid @RequestBody DecisionRequest request) {
        return caseService.applyDecision(id, request);
    }

    /**
     * Health check – used by container readiness probes.
     * GET /api/v1/cases/health
     */
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
