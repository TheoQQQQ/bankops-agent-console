package fi.cgi.bankops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload sent by the AI agent after it has analysed a case.
 * The backend persists this to the audit log so the operator
 * can see what the AI recommended before making their decision.
 */
public record AiAnalysisRequest(

        @NotNull(message = "AI risk assessment is required")
        String riskAssessment,

        @NotBlank(message = "AI summary is required")
        @Size(max = 4000)
        String summary,

        @NotBlank(message = "AI recommendation is required")
        @Size(max = 50)
        String recommendation,

        /** Confidence expressed as a percentage (0–100). */
        int confidencePercent
) {}
