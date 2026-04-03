package fi.cgi.bankops.security;

import fi.cgi.bankops.config.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/**
 * Handles JWT creation and validation.
 *
 * <p>Tokens are signed with HMAC-SHA256. The signing key is derived from
 * the configured secret and is never logged or exposed via any endpoint.</p>
 *
 * <p>Claims structure:
 * <pre>
 *   sub  – username
 *   role – operator role (e.g. "OPERATOR")
 *   iat  – issued-at
 *   exp  – expiry
 * </pre>
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private static final String CLAIM_ROLE = "role";

    private final JwtProperties jwtProperties;

    /** Generates a signed JWT for the given username and role. */
    public String generateToken(String username, String role) {
        Instant now    = Instant.now();
        Instant expiry = now.plus(jwtProperties.expiryMinutes(), ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(username)
                .claim(CLAIM_ROLE, role)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey())
                .compact();
    }

    /**
     * Parses and validates a JWT.
     *
     * @return the claims if the token is valid and unexpired, empty otherwise.
     */
    public Optional<Claims> validateToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Optional.of(claims);
        } catch (ExpiredJwtException ex) {
            log.debug("JWT expired: {}", ex.getMessage());
        } catch (JwtException ex) {
            // Covers malformed, unsigned, tampered tokens
            log.warn("Invalid JWT: {}", ex.getMessage());
        }
        return Optional.empty();
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private SecretKey signingKey() {
        byte[] keyBytes = jwtProperties.secret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
