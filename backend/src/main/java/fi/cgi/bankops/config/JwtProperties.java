package fi.cgi.bankops.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Binds {@code bankops.jwt.*} from application.yml.
 *
 * <p>The secret must be at least 32 characters (256 bits) to satisfy
 * HMAC-SHA256 minimum key length requirements.</p>
 */
@ConfigurationProperties(prefix = "bankops.jwt")
public record JwtProperties(

        @NotBlank
        @Size(min = 32, message = "JWT secret must be at least 32 characters (256 bits)")
        String secret,

        @Min(1)
        int expiryMinutes
) {}
