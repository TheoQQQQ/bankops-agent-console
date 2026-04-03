package fi.cgi.bankops.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration.
 *
 * <p>Accessible at {@code /swagger-ui.html} in local development.
 * The JWT bearer scheme is registered so protected endpoints can
 * be tested directly from the Swagger UI.</p>
 */
@Configuration
@SecurityScheme(
        name             = "bearerAuth",
        type             = SecuritySchemeType.HTTP,
        scheme           = "bearer",
        bearerFormat     = "JWT",
        description      = "Obtain a token from POST /api/v1/auth/login and paste it here."
)
public class OpenApiConfig {

    @Bean
    public OpenAPI bankOpsOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("BankOps Agent Console API")
                        .version("0.1.0")
                        .description(
                            "REST API for AI-assisted banking case review. " +
                            "All case endpoints require JWT bearer authentication.")
                        .contact(new Contact()
                                .name("TheoQQQQ")
                                .url("https://github.com/TheoQQQQ"))
                        .license(new License()
                                .name("MIT")));
    }
}
