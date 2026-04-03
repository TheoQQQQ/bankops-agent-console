package fi.cgi.bankops.service;

import fi.cgi.bankops.dto.AuditLogDto;
import fi.cgi.bankops.dto.CustomerCaseDto;
import fi.cgi.bankops.model.AuditLog;
import fi.cgi.bankops.model.CustomerCase;
import org.springframework.stereotype.Service;

/**
 * Manual mapper replacing MapStruct to avoid annotation-processor
 * compatibility issues with Java 21 and Lombok.
 */
@Service
public class CaseMapper {

    public CustomerCaseDto toDto(CustomerCase e) {
        return new CustomerCaseDto(
                e.getId(),
                e.getCaseRef(),
                e.getCustomerId(),
                e.getCustomerName(),
                e.getCaseType(),
                e.getStatus(),
                e.getRiskLevel(),
                e.getAmount(),
                e.getDescription(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    public AuditLogDto toAuditDto(AuditLog e) {
        return new AuditLogDto(
                e.getId(),
                e.getCaseId(),
                e.getActor(),
                e.getAction(),
                e.getDetail(),
                e.getCreatedAt()
        );
    }
}