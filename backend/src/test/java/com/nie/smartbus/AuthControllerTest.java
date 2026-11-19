package com.nie.smartbus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AuthControllerTest extends ApiTestBase {

    @Test
    void registerCreatesPassengerAndReturnsToken() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("fullName", "Asha", "email", "asha@test.com", "password", "password123"))))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.token").isNotEmpty())
           .andExpect(jsonPath("$.role").value("PASSENGER"));
    }

    @Test
    void registerRejectsShortPasswordAndBadEmail() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("fullName", "A", "email", "not-an-email", "password", "123"))))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.details.email").exists())
           .andExpect(jsonPath("$.details.password").exists());
    }

    @Test
    void duplicateEmailIsConflict() throws Exception {
        passengerToken();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("fullName", "Rider", "email", "rider@test.com", "password", "riderpass123"))))
           .andExpect(status().isConflict());
    }

    @Test
    void loginSucceedsAndWrongPasswordIs401() throws Exception {
        passengerToken();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("email", "rider@test.com", "password", "riderpass123"))))
           .andExpect(status().isOk()).andExpect(jsonPath("$.token").isNotEmpty());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("email", "rider@test.com", "password", "wrong-password"))))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithoutTokenIs401() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
    }

    @Test
    void passengerCannotOpenAdminDashboard() throws Exception {
        mvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + passengerToken()))
           .andExpect(status().isForbidden());
    }
}
