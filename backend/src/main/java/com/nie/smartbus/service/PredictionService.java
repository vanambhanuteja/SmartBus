package com.nie.smartbus.service;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.Prediction;
import com.nie.smartbus.entity.Route;
import com.nie.smartbus.repository.CrowdReportRepository;
import com.nie.smartbus.repository.PredictionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PredictionService {
    private final RouteService routes;
    private final CrowdReportRepository reports;
    private final PredictionRepository predictions;
    private final PredictionClient client;

    public PredictionService(RouteService routes, CrowdReportRepository reports, PredictionRepository predictions, PredictionClient client) {
        this.routes = routes; this.reports = reports; this.predictions = predictions; this.client = client;
    }

    public PredictionDto predict(PredictionRequest r) {
        Route route = routes.find(r.routeId());
        int dow = r.dayOfWeek() != null ? r.dayOfWeek() : LocalDateTime.now().getDayOfWeek().getValue() - 1;
        // feature "recent crowd reports": average of real passenger reports in the last 2 hours (may be null)
        Double recent = reports.averageRecentPassengerOccupancy(route.getId(), LocalDateTime.now().minusHours(2));

        Map<String, Object> res = client.predict(route.getId(), r.travelTime(), dow, recent);
        double pct = ((Number) res.get("predicted_occupancy_percent")).doubleValue();
        String level = String.valueOf(res.get("crowd_category")).toUpperCase();

        Prediction p = new Prediction();
        p.setRouteId(route.getId());
        p.setTravelTime(r.travelTime());
        p.setDayOfWeek(dow);
        p.setPredictedPercent((float) pct);
        p.setCrowdLevel(level);
        predictions.save(p);

        return new PredictionDto(route.getId(), route.getName(), pct, level, r.travelTime(), dow,
                p.getCreatedAt(), recent, String.valueOf(res.get("data_source")));
    }

    public List<Prediction> recentFor(Long routeId) {
        routes.find(routeId);
        return predictions.findTop10ByRouteIdOrderByCreatedAtDesc(routeId);
    }
}
