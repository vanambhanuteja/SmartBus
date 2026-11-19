package com.nie.smartbus;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.service.PredictionClient;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

/** The Python service is mocked here; the real backend-to-ML call is covered by the Docker Compose smoke test. */
class PredictionControllerTest extends ApiTestBase {
    @MockBean PredictionClient client;

    @Test
    void predictionIsReturnedAndStored() throws Exception {
        when(client.predict(anyLong(), anyString(), anyInt(), any())).thenReturn(
                Map.of("predicted_occupancy_percent", 72.5, "crowd_category", "High", "data_source", "SYNTHETIC training data"));
        mvc.perform(post("/api/predictions").header("Authorization", "Bearer " + passengerToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("routeId", routeId, "travelTime", "08:30", "dayOfWeek", 1))))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.crowdLevel").value("HIGH"))
           .andExpect(jsonPath("$.predictedOccupancyPercent").value(72.5));
        mvc.perform(get("/api/predictions/" + routeId).header("Authorization", "Bearer " + passengerToken()))
           .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void badTimeFormatIs400() throws Exception {
        mvc.perform(post("/api/predictions").header("Authorization", "Bearer " + passengerToken())
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("routeId", routeId, "travelTime", "8pm"))))
           .andExpect(status().isBadRequest());
    }

    @Test
    void mlServiceDownGives503() throws Exception {
        when(client.predict(anyLong(), anyString(), anyInt(), any()))
                .thenThrow(new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Prediction service is unavailable"));
        mvc.perform(post("/api/predictions").header("Authorization", "Bearer " + passengerToken())
                .contentType(MediaType.APPLICATION_JSON).content(body(Map.of("routeId", routeId, "travelTime", "09:00"))))
           .andExpect(status().isServiceUnavailable());
    }
}
