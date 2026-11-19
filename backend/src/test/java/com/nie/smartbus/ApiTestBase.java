package com.nie.smartbus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nie.smartbus.entity.*;
import com.nie.smartbus.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Shared setup: H2 in-memory DB, a clean state, one admin, one stop and one route per test. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class ApiTestBase {
    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected UserRepository users;
    @Autowired protected RouteRepository routes;
    @Autowired protected BusStopRepository stops;
    @Autowired protected RouteStopRepository routeStops;
    @Autowired protected CrowdReportRepository reports;
    @Autowired protected PredictionRepository predictions;
    @Autowired protected PasswordEncoder encoder;

    protected Long routeId;
    protected Long stopId;

    @BeforeEach
    void resetData() {
        reports.deleteAll(); predictions.deleteAll(); routeStops.deleteAll(); routes.deleteAll(); stops.deleteAll(); users.deleteAll();
        User admin = new User();
        admin.setFullName("Admin"); admin.setEmail("admin@test.com"); admin.setRole("ADMIN");
        admin.setPasswordHash(encoder.encode("adminpass123"));
        users.save(admin);
        BusStop s = new BusStop(); s.setName("Test Stop"); s.setLatitude(12.3); s.setLongitude(76.6);
        stopId = stops.save(s).getId();
        Route r = new Route(); r.setRouteCode("T-01"); r.setName("Test Route"); r.setActive(true);
        routeId = routes.save(r).getId();
        routeStops.save(new RouteStop(routeId, stopId, 1));
    }

    protected String body(Object o) throws Exception { return json.writeValueAsString(o); }

    protected String token(String email, String password) throws Exception {
        String res = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(body(java.util.Map.of("email", email, "password", password)))).andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("token").asText();
    }

    protected String adminToken() throws Exception { return token("admin@test.com", "adminpass123"); }

    protected String passengerToken() throws Exception {
        if (users.findByEmail("rider@test.com").isEmpty()) {
            mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(body(java.util.Map.of("fullName", "Rider", "email", "rider@test.com", "password", "riderpass123"))));
        }
        return token("rider@test.com", "riderpass123");
    }

    protected static MockHttpServletRequestBuilder post(String url) {
        return org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(url);
    }
}
