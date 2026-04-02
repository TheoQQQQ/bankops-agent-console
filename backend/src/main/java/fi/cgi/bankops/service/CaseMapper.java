package fi.cgi.bankops.service;

import fi.cgi.bankops.dto.AuditLogDto;
import fi.cgi.bankops.dto.CustomerCaseDto;
import fi.cgi.bankops.model.AuditLog;
import fi.cgi.bankops.model.CustomerCase;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

/**
 * MapStruct mapper – compile-time generated, zero reflection.
 * Field names match exactly between entity and DTO so no explicit
 * {@code @Mapping} annotations are needed here.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CaseMapper {

    CustomerCaseDto toDto(CustomerCase entity);

    AuditLogDto toAuditDto(AuditLog entity);
}
