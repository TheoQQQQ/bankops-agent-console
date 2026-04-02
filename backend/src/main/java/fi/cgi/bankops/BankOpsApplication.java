package fi.cgi.bankops;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * BankOps Agent Console – entry point.
 *
 * <p>This service exposes a REST API that simulates a legacy core-banking
 * case-management surface. An AI agent (orchestrated by the TypeScript
 * frontend) calls these endpoints to read cases, record its analysis, and
 * submit operator decisions with a full audit trail.</p>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class BankOpsApplication {

    public static void main(String[] args) {
        SpringApplication.run(BankOpsApplication.class, args);
    }
}
