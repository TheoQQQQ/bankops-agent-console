package fi.cgi.bankops.repository;

import fi.cgi.bankops.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByCaseIdOrderByCreatedAtAsc(Long caseId);
}
