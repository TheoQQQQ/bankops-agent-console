package fi.cgi.bankops.service;

import fi.cgi.bankops.audit.AuditService;
import fi.cgi.bankops.dto.*;
import fi.cgi.bankops.exception.CaseNotFoundException;
import fi.cgi.bankops.exception.InvalidStateTransitionException;
import fi.cgi.bankops.model.*;
import fi.cgi.bankops.repository.AuditLogRepository;
import fi.cgi.bankops.repository.CustomerCaseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CaseService")
class CaseServiceTest {

    @Mock private CustomerCaseRepository caseRepository;
    @Mock private AuditLogRepository     auditLogRepository;
    @Mock private AuditService           auditService;
    @Spy  private CaseMapper             caseMapper = new CaseMapperImpl();

    @InjectMocks
    private CaseService caseService;

    private CustomerCase pendingCase;
    private CustomerCase approvedCase;

    @BeforeEach
    void setUp() {
        pendingCase = CustomerCase.builder()
                .id(1L)
                .caseRef("CASE-TEST-001")
                .customerId("CUST-001")
                .customerName("Test Customer")
                .caseType(CaseType.FRAUD_ALERT)
                .status(CaseStatus.PENDING)
                .riskLevel(RiskLevel.HIGH)
                .amount(new BigDecimal("5000.00"))
                .description("Test fraud alert description")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        approvedCase = CustomerCase.builder()
                .id(2L)
                .caseRef("CASE-TEST-002")
                .customerId("CUST-002")
                .customerName("Closed Customer")
                .caseType(CaseType.KYC_REVIEW)
                .status(CaseStatus.APPROVED)
                .riskLevel(RiskLevel.LOW)
                .amount(null)
                .description("Already approved case")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
    }

    @Nested
    @DisplayName("getActiveCases")
    class GetActiveCases {

        @Test
        @DisplayName("returns mapped DTOs from repository")
        void returnsPagedDtos() {
            var page = new PageImpl<>(List.of(pendingCase));
            when(caseRepository.findActiveCasesPaginated(any(), any(), any(Pageable.class)))
                    .thenReturn(page);

            var result = caseService.getActiveCases(Pageable.unpaged());

            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).caseRef()).isEqualTo("CASE-TEST-001");
        }
    }

    @Nested
    @DisplayName("getCaseById")
    class GetCaseById {

        @Test
        @DisplayName("throws CaseNotFoundException for unknown ID")
        void throwsForUnknownId() {
            when(caseRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> caseService.getCaseById(99L))
                    .isInstanceOf(CaseNotFoundException.class)
                    .hasMessageContaining("99");
        }

        @Test
        @DisplayName("returns DTO for known ID")
        void returnsDtoForKnownId() {
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));

            var result = caseService.getCaseById(1L);

            assertThat(result.id()).isEqualTo(1L);
            assertThat(result.status()).isEqualTo(CaseStatus.PENDING);
        }
    }

    @Nested
    @DisplayName("applyDecision")
    class ApplyDecision {

        @Test
        @DisplayName("transitions PENDING case to APPROVED and logs the decision")
        void approvesPendingCase() {
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));
            when(caseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var request = new DecisionRequest(
                    CaseStatus.APPROVED, "demo.operator", "Looks legitimate", null);

            var result = caseService.applyDecision(1L, request);

            assertThat(result.status()).isEqualTo(CaseStatus.APPROVED);
            verify(auditService).record(eq(1L), contains("OPERATOR"), eq("APPROVED"), any());
        }

        @Test
        @DisplayName("throws InvalidStateTransitionException when case is already terminal")
        void rejectsTerminalCaseDecision() {
            when(caseRepository.findById(2L)).thenReturn(Optional.of(approvedCase));

            var request = new DecisionRequest(
                    CaseStatus.REJECTED, "demo.operator", "Changed mind", null);

            assertThatThrownBy(() -> caseService.applyDecision(2L, request))
                    .isInstanceOf(InvalidStateTransitionException.class)
                    .hasMessageContaining("terminal");
        }

        @Test
        @DisplayName("writes DECISION_OVERRIDE when operator contradicts AI")
        void logsOverrideWhenOperatorContradicts() {
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));
            when(caseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var request = new DecisionRequest(
                    CaseStatus.APPROVED, "demo.operator",
                    "I reviewed more context and disagree", "REJECT");

            caseService.applyDecision(1L, request);

            var actionCaptor = ArgumentCaptor.forClass(String.class);
            verify(auditService, times(2))
                    .record(eq(1L), any(), actionCaptor.capture(), any());

            assertThat(actionCaptor.getAllValues())
                    .contains("APPROVED", "DECISION_OVERRIDE");
        }

        @Test
        @DisplayName("does NOT write override when AI and operator agree")
        void noOverrideWhenAgreement() {
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));
            when(caseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var request = new DecisionRequest(
                    CaseStatus.REJECTED, "demo.operator", "Agreed with AI", "REJECT");

            caseService.applyDecision(1L, request);

            verify(auditService, times(1))
                    .record(eq(1L), any(), eq("REJECTED"), any());
        }

        @Test
        @DisplayName("strips HTML tags from operator rationale before audit logging")
        void sanitisesHtmlInRationale() {
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));
            when(caseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var request = new DecisionRequest(
                    CaseStatus.APPROVED,
                    "demo.operator",
                    "<script>alert('xss')</script>Legitimate reason",
                    null);

            caseService.applyDecision(1L, request);

            var detailCaptor = ArgumentCaptor.forClass(String.class);
            verify(auditService).record(any(), any(), any(), detailCaptor.capture());

            assertThat(detailCaptor.getValue()).doesNotContain("<script>");
            assertThat(detailCaptor.getValue()).contains("Legitimate reason");
        }
    }

    @Nested
    @DisplayName("recordAiAnalysis")
    class RecordAiAnalysis {

        @Test
        @DisplayName("transitions PENDING to UNDER_REVIEW on AI analysis")
        void transitionsToPendingOnAnalysis() {
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));
            when(caseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var request = new AiAnalysisRequest("HIGH", "Suspicious pattern.", "REJECT", 85);

            var result = caseService.recordAiAnalysis(1L, request);

            assertThat(result.status()).isEqualTo(CaseStatus.UNDER_REVIEW);
            verify(auditService).record(eq(1L), eq("AI_AGENT"), eq("AI_ANALYSED"), any());
        }

        @Test
        @DisplayName("does not downgrade status if already UNDER_REVIEW")
        void doesNotDowngradeUnderReview() {
            pendingCase.setStatus(CaseStatus.UNDER_REVIEW);
            when(caseRepository.findById(1L)).thenReturn(Optional.of(pendingCase));
            when(caseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            var request = new AiAnalysisRequest("HIGH", "Re-analysis.", "ESCALATE", 70);
            var result  = caseService.recordAiAnalysis(1L, request);

            assertThat(result.status()).isEqualTo(CaseStatus.UNDER_REVIEW);
        }
    }
}