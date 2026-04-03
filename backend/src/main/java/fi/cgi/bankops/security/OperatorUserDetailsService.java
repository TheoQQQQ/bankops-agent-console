package fi.cgi.bankops.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * In-memory user store for demo purposes.
 *
 * <p>In a production system this would query an LDAP directory or a
 * dedicated identity provider (e.g. Azure AD, Keycloak). The passwords
 * below are BCrypt-hashed so they are never stored in plain text.</p>
 *
 * <p>Demo credentials:
 * <pre>
 *   username: demo.operator   password: BankOps2024!
 *   username: senior.analyst  password: Analyst2024!
 * </pre>
 * </p>
 */
@Service
public class OperatorUserDetailsService implements UserDetailsService {

    /**
     * Pre-computed BCrypt hashes.
     * Generate with: {@code new BCryptPasswordEncoder().encode("password")}
     */
    private static final Map<String, String> USER_STORE = Map.of(
            "demo.operator",  "$2a$12$7Xt7FvMxqV6R5jQlVU5lGO3n9w8LBvCHAzOwRECWF1z.e7Yh3ZZRe",
            "senior.analyst", "$2a$12$mHKgA8L6lLWVEY7E3RN2E.Qkpas8rFDThZq7cSKOEW8A9Gv4KWbJ2"
    );

    private final PasswordEncoder passwordEncoder;

    public OperatorUserDetailsService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String hash = USER_STORE.get(username.toLowerCase());
        if (hash == null) {
            // Constant-time rejection – do not reveal whether username exists
            throw new UsernameNotFoundException("Authentication failed");
        }
        return User.builder()
                .username(username)
                .password(hash)
                .roles("OPERATOR")
                .build();
    }
}
