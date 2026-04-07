package fi.cgi.bankops.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GenerateCasesRequest(
        @NotEmpty @Size(max = 50, message = "Batch size must not exceed 50 cases")
        @Valid List<CasePayload> cases
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
