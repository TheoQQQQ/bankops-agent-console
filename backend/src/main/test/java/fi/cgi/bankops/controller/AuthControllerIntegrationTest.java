package fi.cgi.bankops.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import fi.cgi.bankops.dto.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("AuthController (integration)")
class AuthControllerIntegrationTest {

    @Autowired MockMvc      mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /login with valid credentials returns 200 and a JWT")
    void loginWithValidCredentials() throws Exception {
        var request = new LoginRequest("demo.operator", "BankOps2024!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.username").value("demo.operator"))
                .andExpect(jsonPath("$.role").value("OPERATOR"));
    }

    @Test
    @DisplayName("POST /login with wrong password returns 401")
    void loginWithWrongPassword() throws Exception {
        var request = new LoginRequest("demo.operator", "WrongPassword!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /login with unknown username returns 401")
    void loginWithUnknownUsername() throws Exception {
        var request = new LoginRequest("hacker.smith", "BankOps2024!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /cases/active without token returns 403")
    void protectedEndpointWithoutToken() throws Exception {
        mockMvc.perform(post("/api/v1/cases/active"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /login with injection attempt in username returns 422")
    void loginWithInjectionAttempt() throws Exception {
        var body = """
                {"username": "admin' OR '1'='1", "password": "anything"}
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity());
    }
}