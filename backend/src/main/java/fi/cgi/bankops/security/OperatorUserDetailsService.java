package fi.cgi.bankops.security;

import org.springframework.context.annotation.Lazy;
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
 * Passwords are BCrypt-hashed at startup using the application PasswordEncoder.
 * In production, replace with an LDAP or identity-provider backed implementation.
 *
 * Demo credentials:
 *   demo.operator  / BankOps2024!
 *   senior.analyst / Analyst2024!
 */
@Service
public class OperatorUserDetailsService implements UserDetailsService {

    private final Map<String, String> userStore;

    public OperatorUserDetailsService(@Lazy PasswordEncoder passwordEncoder) {
        this.userStore = Map.of(
                "demo.operator",  passwordEncoder.encode("BankOps2024!"),
                "senior.analyst", passwordEncoder.encode("Analyst2024!")
        );
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String hash = userStore.get(username.toLowerCase());
        if (hash == null) {
            // Constant-time rejection — do not reveal whether username exists
            throw new UsernameNotFoundException("Authentication failed");
        }
        return User.builder()
                .username(username)
                .password(hash)
                .roles("OPERATOR")
                .build();
    }
}