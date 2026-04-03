package fi.cgi.bankops.security;

import fi.cgi.bankops.config.JwtProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtService")
class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        var props = new JwtProperties("test-secret-key-for-unit-tests!!", 60);
        jwtService = new JwtService(props);
    }

    @Test
    @DisplayName("generates a token and extracts the correct subject and role")
    void generateAndValidate() {
        String token = jwtService.generateToken("test.user", "OPERATOR");

        var claims = jwtService.validateToken(token);

        assertThat(claims).isPresent();
        assertThat(claims.get().getSubject()).isEqualTo("test.user");
        assertThat(claims.get().get("role", String.class)).isEqualTo("OPERATOR");
    }

    @Test
    @DisplayName("rejects a tampered token")
    void rejectsTamperedToken() {
        String token    = jwtService.generateToken("test.user", "OPERATOR");
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";

        assertThat(jwtService.validateToken(tampered)).isEmpty();
    }

    @Test
    @DisplayName("rejects malformed tokens")
    void rejectsMalformedToken() {
        assertThat(jwtService.validateToken("not.a.jwt")).isEmpty();
        assertThat(jwtService.validateToken("")).isEmpty();
        assertThat(jwtService.validateToken("   ")).isEmpty();
    }
}