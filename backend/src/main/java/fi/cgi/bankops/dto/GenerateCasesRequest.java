package fi.cgi.bankops.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record GenerateCasesRequest(
        @NotEmpty @Valid List<CasePayload> cases
) {
    public record CasePayload(
            String caseRef,
            String customerId,
            String customerName,
            String caseType,
            String riskLevel,
            String amount,
            String description
    ) {}
}