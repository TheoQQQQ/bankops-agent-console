package fi.cgi.bankops.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Binds {@code bankops.cors.*} from application.yml.
 * Centralises CORS configuration and makes it environment-aware.
 */
@ConfigurationProperties(prefix = "bankops.cors")
public record CorsProperties(List<String> allowedOrigins) {}
