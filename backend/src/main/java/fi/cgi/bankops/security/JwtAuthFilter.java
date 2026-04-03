package fi.cgi.bankops.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Extracts the JWT from the {@code Authorization: Bearer <token>} header,
 * validates it, and populates the Spring Security context.
 *
 * <p>Runs once per request ({@link OncePerRequestFilter}) before the
 * security filter chain evaluates access rules.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String CLAIM_ROLE    = "role";

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest  request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain         chain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith(BEARER_PREFIX)) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(BEARER_PREFIX.length());

        jwtService.validateToken(token).ifPresent(claims -> {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                setAuthentication(claims, request);
            }
        });

        chain.doFilter(request, response);
    }

    private void setAuthentication(Claims claims, HttpServletRequest request) {
        String role     = claims.get(CLAIM_ROLE, String.class);
        String username = claims.getSubject();

        var authority = new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "OPERATOR"));

        var auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(authority));
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

        SecurityContextHolder.getContext().setAuthentication(auth);
        log.debug("Authenticated user '{}' with role '{}'", username, role);
    }
}
