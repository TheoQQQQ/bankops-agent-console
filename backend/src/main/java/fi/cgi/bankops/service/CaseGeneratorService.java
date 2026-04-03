package fi.cgi.bankops.service;

import fi.cgi.bankops.dto.CustomerCaseDto;
import fi.cgi.bankops.dto.GenerateCasesRequest.CasePayload;
import fi.cgi.bankops.model.*;
import fi.cgi.bankops.repository.CustomerCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CaseGeneratorService {

    private final CustomerCaseRepository caseRepository;
    private final CaseMapper             caseMapper;

    @Transactional
    public List<CustomerCaseDto> saveBatch(List<CasePayload> payloads) {
        List<CustomerCase> saved = payloads.stream()
                .map(this::toEntity)
                .filter(c -> !caseRepository.existsByCaseRef(c.getCaseRef()))
                .map(caseRepository::save)
                .toList();

        log.info("AI-generated {} new cases (from {} requested)", saved.size(), payloads.size());
        return saved.stream().map(caseMapper::toDto).toList();
    }

    private CustomerCase toEntity(CasePayload p) {
        BigDecimal amount = null;
        if (p.amount() != null && !p.amount().isBlank()) {
            try {
                amount = new BigDecimal(p.amount().replaceAll("[^\\d.]", ""));
            } catch (NumberFormatException ignored) {}
        }

        return CustomerCase.builder()
                .caseRef(p.caseRef())
                .customerId(p.customerId())
                .customerName(p.customerName())
                .caseType(CaseType.valueOf(p.caseType()))
                .status(CaseStatus.PENDING)
                .riskLevel(RiskLevel.valueOf(p.riskLevel()))
                .amount(amount)
                .description(p.description())
                .build();
    }
}