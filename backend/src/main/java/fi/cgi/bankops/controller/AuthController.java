package fi.cgi.bankops.controller;

import fi.cgi.bankops.config.JwtProperties;
import fi.cgi.bankops.dto.LoginRequest;
import fi.cgi.bankops.dto.LoginResponse;
import fi.cgi.bankops.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Authentication endpoint.
 *
 * <p>Accepts credentials, delegates to Spring Security's
 * {@link AuthenticationManager}, and returns a signed JWT on success.</p>
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Login and token management")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService            jwtService;
    private final JwtProperties         jwtProperties;

    /**
     * Authenticate operator credentials and return a JWT.
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    @Operation(summary = "Login", description = "Authenticate and receive a JWT bearer token")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.username(), request.password()));

            String role  = auth.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElse("OPERATOR");

            String token = jwtService.generateToken(auth.getName(), role);

            log.info("Successful login for user '{}'", auth.getName());

            return new LoginResponse(
                    token,
                    auth.getName(),
                    role,
                    (long) jwtProperties.expiryMinutes() * 60
            );

        } catch (BadCredentialsException ex) {
            // Intentionally vague – do not reveal whether username or password was wrong
            log.warn("Failed login attempt for username '{}'", request.username());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
    }
}
