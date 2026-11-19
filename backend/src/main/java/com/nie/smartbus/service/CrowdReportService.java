package com.nie.smartbus.service;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.CrowdLevel;
import com.nie.smartbus.entity.CrowdReport;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.CrowdReportRepository;
import com.nie.smartbus.repository.UserRepository;
import java.util.List;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
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
        Long userId=users.findByEmail(email).map(u -> u.getId()).orElse(null);
        LocalDateTime now=LocalDateTime.now();
        if(userId!=null&&reports.existsByUserIdAndReportedAtAfter(userId,now.minusSeconds(60)))
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"Please wait one minute before submitting another report");
        CrowdReport rep = new CrowdReport();
        rep.setRouteId(r.routeId());
        rep.setTripId(r.tripId());
        rep.setUserId(userId);
        rep.setCrowdLevel(level.name());
        rep.setOccupancyPercent(level.getMidpoint());
        rep.setSource("PASSENGER");
        rep.setNote(r.note());
        Double baseline=reports.averagePassengerOccupancy(r.routeId(),now.minusDays(30));
        rep.setFlagged(baseline!=null&&Math.abs(level.getMidpoint()-baseline)>=50.0);
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
