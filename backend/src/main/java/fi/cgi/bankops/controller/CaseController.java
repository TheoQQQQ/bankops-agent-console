package fi.cgi.bankops.controller;

import fi.cgi.bankops.dto.*;
import fi.cgi.bankops.service.CaseGeneratorService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
@Validated
@Tag(name = "Cases", description = "Customer case lifecycle management")
@SecurityRequirement(name = "bearerAuth")
public class CaseController {

    private final CaseService          caseService;
    private final CaseGeneratorService caseGeneratorService;

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
            @Min(1) @Max(100) int size) {
        return caseService.getActiveCases(PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get case by ID")
    public CustomerCaseDto getCase(@PathVariable Long id) {
        return caseService.getCaseById(id);
    }

    @GetMapping("/{id}/audit")
    @Operation(summary = "Get audit trail")
    public List<AuditLogDto> getAuditLog(@PathVariable Long id) {
        return caseService.getAuditLog(id);
    }

    @PostMapping("/{id}/ai-analysis")
    @Operation(summary = "Record AI analysis")
    public CustomerCaseDto recordAiAnalysis(
            @PathVariable Long id,
            @Valid @RequestBody AiAnalysisRequest request) {
        return caseService.recordAiAnalysis(id, request);
    }

    @PostMapping("/{id}/decision")
    @Operation(summary = "Submit operator decision")
    public CustomerCaseDto applyDecision(
            @PathVariable Long id,
            @Valid @RequestBody DecisionRequest request) {
        return caseService.applyDecision(id, request);
    }

    @PostMapping("/{id}/note")
    @Operation(summary = "Add operator note", description = "Appends a free-text note to the case audit trail.")
    public CustomerCaseDto addNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        return caseService.addNote(id, request);
    }

    @PostMapping("/generate")
    @Operation(
        summary     = "Persist AI-generated cases",
        description = "Accepts a batch of AI-generated cases from the frontend and inserts them into the database."
    )
    public ResponseEntity<List<CustomerCaseDto>> generateCases(
            @Valid @RequestBody GenerateCasesRequest request) {
        List<CustomerCaseDto> created = caseGeneratorService.saveBatch(request.cases());
        return ResponseEntity.ok(created);
    }

    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}