package fi.cgi.bankops.dto;

import fi.cgi.bankops.model.CaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload submitted by the operator when they approve, reject,
 * or escalate a case.
 *
 * <p>The {@code operator} field is expected to be the authenticated
 * username. In a production system this would be derived from the
 * JWT principal, not supplied by the client.</p>
 */
public record DecisionRequest(

        @NotNull(message = "Decision status is required")
        CaseStatus decision,

        @NotBlank(message = "Operator identifier is required")
        @Size(max = 60)
        String operator,

        @Size(max = 2000)
        String rationale
) {}
