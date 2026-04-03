package fi.cgi.bankops.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Login credentials submitted to {@code POST /api/v1/auth/login}.
 *
 * <p>Input is validated before reaching the authentication layer:
 * <ul>
 *   <li>Username is restricted to alphanumeric characters and dots to
 *       prevent injection attacks before the value is even processed.</li>
 *   <li>Size limits prevent excessively long inputs from reaching BCrypt,
 *       which has a known 72-byte input limit.</li>
 * </ul>
 * </p>
 */
public record LoginRequest(

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 60, message = "Username must be 3–60 characters")
        @Pattern(
            regexp  = "^[a-zA-Z0-9._-]+$",
            message = "Username may only contain letters, digits, dots, hyphens, and underscores"
        )
        String username,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be 8–72 characters")
        String password
) {}
