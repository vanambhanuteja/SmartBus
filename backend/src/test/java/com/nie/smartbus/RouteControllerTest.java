package com.nie.smartbus;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class RouteControllerTest extends ApiTestBase {

    @Test
    void routesArePublicAndIncludeStops() throws Exception {
        mvc.perform(get("/api/routes")).andExpect(status().isOk())
           .andExpect(jsonPath("$[0].routeCode").value("T-01"))
           .andExpect(jsonPath("$[0].stops[0].name").value("Test Stop"));
    }

    @Test
    void getUnknownRouteIs404() throws Exception {
        mvc.perform(get("/api/routes/999999")).andExpect(status().isNotFound());
    }

    @Test
    void passengerCannotCreateRoute() throws Exception {
        mvc.perform(post("/api/routes").header("Authorization", "Bearer " + passengerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeCode", "X-1", "name", "X", "active", true, "stopIds", List.of(stopId)))))
           .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateRouteWithStops() throws Exception {
        mvc.perform(post("/api/routes").header("Authorization", "Bearer " + adminToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeCode", "X-1", "name", "New Route", "active", true, "stopIds", List.of(stopId)))))
           .andExpect(status().isCreated()).andExpect(jsonPath("$.stops.length()").value(1));
    }

    @Test
    void adminCreateRejectsUnknownStopAndDuplicateCode() throws Exception {
        String t = adminToken();
        mvc.perform(post("/api/routes").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeCode", "X-2", "name", "Bad", "active", true, "stopIds", List.of(987654)))))
           .andExpect(status().isBadRequest());
        mvc.perform(post("/api/routes").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeCode", "T-01", "name", "Dup", "active", true, "stopIds", List.of(stopId)))))
           .andExpect(status().isConflict());
    }

    @Test
    void adminCanDeleteStopAndRoute() throws Exception {
        String t = adminToken();
        mvc.perform(delete("/api/routes/" + routeId).header("Authorization", "Bearer " + t)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/stops/" + stopId).header("Authorization", "Bearer " + t)).andExpect(status().isNoContent());
    }
}
