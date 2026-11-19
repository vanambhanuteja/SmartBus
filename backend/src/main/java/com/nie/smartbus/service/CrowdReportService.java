package com.nie.smartbus.service;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.CrowdLevel;
import com.nie.smartbus.entity.CrowdReport;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.CrowdReportRepository;
import com.nie.smartbus.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CrowdReportService {
    private final CrowdReportRepository reports;
    private final UserRepository users;
    private final RouteService routes;

    public CrowdReportService(CrowdReportRepository reports, UserRepository users, RouteService routes) {
        this.reports = reports; this.users = users; this.routes = routes;
    }

    public CrowdReportDto submit(CrowdReportRequest r, String email) {
        routes.find(r.routeId());   // 404 if the route does not exist
        CrowdLevel level = CrowdLevel.valueOf(r.crowdLevel());
        CrowdReport rep = new CrowdReport();
        rep.setRouteId(r.routeId());
        rep.setTripId(r.tripId());
        rep.setUserId(users.findByEmail(email).map(u -> u.getId()).orElse(null));
        rep.setCrowdLevel(level.name());
        rep.setOccupancyPercent(level.getMidpoint());
        rep.setSource("PASSENGER");
        rep.setNote(r.note());
        return toDto(reports.save(rep));
    }

    public List<CrowdReportDto> list(Long routeId) {
        var rows = routeId == null ? reports.findTop50ByOrderByReportedAtDesc()
                                   : reports.findTop50ByRouteIdOrderByReportedAtDesc(routeId);
        return rows.stream().map(this::toDto).toList();
    }

    public void delete(Long id) {
        if (!reports.existsById(id)) throw ApiException.notFound("Report");
        reports.deleteById(id);
    }

    private CrowdReportDto toDto(CrowdReport c) {
        return new CrowdReportDto(c.getId(), c.getRouteId(), c.getTripId(), c.getOccupancyPercent(),
                c.getCrowdLevel(), c.getSource(), c.getNote(), c.getReportedAt());
    }
}
