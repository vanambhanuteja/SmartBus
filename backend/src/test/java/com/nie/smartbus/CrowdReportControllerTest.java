package com.nie.smartbus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class CrowdReportControllerTest extends ApiTestBase {

    @Test
    void anonymousCannotSubmit() throws Exception {
        mvc.perform(post("/api/crowd-reports").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeId", routeId, "crowdLevel", "HIGH")))).andExpect(status().isUnauthorized());
    }

    @Test
    void passengerSubmitsAndReportIsListed() throws Exception {
        String t = passengerToken();
        mvc.perform(post("/api/crowd-reports").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeId", routeId, "crowdLevel", "HIGH", "note", "standing room only"))))
           .andExpect(status().isCreated())
           .andExpect(jsonPath("$.source").value("PASSENGER"))
           .andExpect(jsonPath("$.occupancyPercent").value(73));
        mvc.perform(get("/api/crowd-reports").header("Authorization", "Bearer " + t).param("routeId", routeId.toString()))
           .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void invalidLevelAndUnknownRouteAreRejected() throws Exception {
        String t = passengerToken();
        mvc.perform(post("/api/crowd-reports").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeId", routeId, "crowdLevel", "PACKED")))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/crowd-reports").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeId", 424242, "crowdLevel", "LOW")))).andExpect(status().isNotFound());
    }

    @Test
    void onlyAdminCanDeleteReports() throws Exception {
        String t = passengerToken();
        String res = mvc.perform(post("/api/crowd-reports").header("Authorization", "Bearer " + t)
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("routeId", routeId, "crowdLevel", "LOW"))))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(res).get("id").asLong();
        mvc.perform(delete("/api/crowd-reports/" + id).header("Authorization", "Bearer " + t)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/crowd-reports/" + id).header("Authorization", "Bearer " + adminToken())).andExpect(status().isNoContent());
    }

    @Test
    void adminDashboardCountsReports() throws Exception {
        mvc.perform(post("/api/crowd-reports").header("Authorization", "Bearer " + passengerToken())
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("routeId", routeId, "crowdLevel", "OVERCROWDED"))));
        mvc.perform(get("/api/admin/dashboard").header("Authorization", "Bearer " + adminToken()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.totalReports").value(1))
           .andExpect(jsonPath("$.totalRoutes").value(1))
           .andExpect(jsonPath("$.crowdDistribution.OVERCROWDED").value(1));
    }
}
