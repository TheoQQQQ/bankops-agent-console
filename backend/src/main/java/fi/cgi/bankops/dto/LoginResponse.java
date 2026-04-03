package fi.cgi.bankops.dto;

/**
 * Returned on successful authentication.
 * The token is a signed JWT the client must include as
 * {@code Authorization: Bearer <token>} on subsequent requests.
 */
public record LoginResponse(
        String token,
        String username,
        String role,
        long expiresInSeconds
) {}
