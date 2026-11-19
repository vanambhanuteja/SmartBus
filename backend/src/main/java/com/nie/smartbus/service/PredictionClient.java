package com.nie.smartbus.service;

import com.nie.smartbus.config.AppProperties;
import com.nie.smartbus.exception.ApiException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Calls the Python prediction service over REST. */
@Component
public class PredictionClient {
    private final RestClient client;

    public PredictionClient(AppProperties props) {
        this.client = RestClient.builder().baseUrl(props.predictionUrl()).build();
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> predict(long routeId, String travelTime, int dayOfWeek, Double recentAvg) {
        Map<String, Object> body = new HashMap<>();
        body.put("route_id", routeId);
        body.put("travel_time", travelTime);
        body.put("day_of_week", dayOfWeek);
        if (recentAvg != null) body.put("recent_reports_avg", recentAvg);
        try {
            return client.post().uri("/predict").body(body).retrieve().body(Map.class);
        } catch (RestClientException e) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Prediction service is unavailable or rejected the request");
        }
    }
}
