package com.nie.smartbus.service;

import com.nie.smartbus.dto.Dtos.DashboardDto;
import com.nie.smartbus.repository.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    private final RouteRepository routes;
    private final BusRepository buses;
    private final BusStopRepository stops;
    private final CrowdReportRepository reports;

    public AdminService(RouteRepository routes, BusRepository buses, BusStopRepository stops, CrowdReportRepository reports) {
        this.routes = routes; this.buses = buses; this.stops = stops; this.reports = reports;
    }

    public DashboardDto dashboard() {
        Map<String, Long> dist = new LinkedHashMap<>();
        for (String l : List.of("LOW", "MODERATE", "HIGH", "OVERCROWDED")) dist.put(l, 0L);
        reports.countByCrowdLevel().forEach(row -> dist.put(String.valueOf(row[0]), ((Number) row[1]).longValue()));

        Map<String, Long> bySource = new LinkedHashMap<>();
        reports.countBySource().forEach(row -> bySource.put(String.valueOf(row[0]), ((Number) row[1]).longValue()));

        Map<Integer, Double> byHour = new TreeMap<>();
        reports.averageOccupancyByHour().forEach(row ->
                byHour.put(((Number) row[0]).intValue(), Math.round(((Number) row[1]).doubleValue() * 10) / 10.0));

        return new DashboardDto(routes.count(), buses.count(), stops.count(), reports.count(), dist, bySource, byHour);
    }
}
