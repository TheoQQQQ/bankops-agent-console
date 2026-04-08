package fi.cgi.bankops.dto;

import fi.cgi.bankops.model.CaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload submitted by the operator when they approve, reject,
 * or escalate a case.
 *
 * <p>{@code aiRecommendation} is optional but strongly encouraged.
 * When present and it differs from the operator's decision, the
 * audit service records an explicit DECISION_OVERRIDE entry —
 * a regulatory requirement under EBA AI governance guidelines.</p>
 */
public record DecisionRequest(

        @NotNull(message = "Decision status is required")
        CaseStatus decision,

        @NotBlank(message = "Operator identifier is required")
        @Size(max = 60)
        String operator,

        @Size(min = 10, max = 2000)
        String rationale,

        /**
         * The AI agent's recommendation at the time of the decision.
         * Nullable — submitted only when an AI analysis was performed.
         * Values: APPROVE | REJECT | ESCALATE | NEEDS_MORE_INFO
         */
        @Size(max = 50)
        String aiRecommendation
) {}
