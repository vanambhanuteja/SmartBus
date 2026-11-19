package com.nie.smartbus.service;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.*;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RouteService {
    private final RouteRepository routes;
    private final RouteStopRepository routeStops;
    private final BusStopRepository stops;

    public RouteService(RouteRepository routes, RouteStopRepository routeStops, BusStopRepository stops) {
        this.routes = routes; this.routeStops = routeStops; this.stops = stops;
    }

    public List<RouteDto> list() { return routes.findAll().stream().map(this::toDto).toList(); }

    public RouteDto get(Long id) { return toDto(find(id)); }

    public Route find(Long id) { return routes.findById(id).orElseThrow(() -> ApiException.notFound("Route")); }

    @Transactional
    public RouteDto create(RouteRequest r) {
        if (routes.existsByRouteCode(r.routeCode())) throw new ApiException(HttpStatus.CONFLICT, "Route code already exists");
        Route route = new Route();
        apply(route, r);
        routes.save(route);
        saveStops(route.getId(), r.stopIds());
        return toDto(route);
    }

    @Transactional
    public RouteDto update(Long id, RouteRequest r) {
        Route route = find(id);
        apply(route, r);
        routes.save(route);
        routeStops.deleteByRouteId(id);
        routeStops.flush();
        saveStops(id, r.stopIds());
        return toDto(route);
    }

    @Transactional
    public void delete(Long id) {
        find(id);
        routeStops.deleteByRouteId(id);
        routes.deleteById(id);
        routes.flush();   // surfaces FK violations (trips/reports exist) as 409 via the exception handler
    }

    private void apply(Route route, RouteRequest r) {
        route.setRouteCode(r.routeCode().trim());
        route.setName(r.name().trim());
        route.setActive(r.active());
    }

    private void saveStops(Long routeId, List<Long> stopIds) {
        if (stopIds.stream().distinct().count() != stopIds.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "stopIds contains duplicates");
        if (stops.findAllById(stopIds).size() != stopIds.size()) throw new ApiException(HttpStatus.BAD_REQUEST, "One or more stopIds do not exist");
        for (int i = 0; i < stopIds.size(); i++) routeStops.save(new RouteStop(routeId, stopIds.get(i), i + 1));
    }

    private RouteDto toDto(Route route) {
        List<RouteStop> links = routeStops.findByRouteIdOrderByStopSequence(route.getId());
        Map<Long, BusStop> byId = stops.findAllById(links.stream().map(RouteStop::getStopId).toList()).stream()
                .collect(Collectors.toMap(BusStop::getId, Function.identity()));
        List<StopDto> out = new ArrayList<>();
        for (RouteStop l : links) {
            BusStop s = byId.get(l.getStopId());
            if (s != null) out.add(new StopDto(s.getId(), s.getName(), s.getLatitude(), s.getLongitude()));
        }
        return new RouteDto(route.getId(), route.getRouteCode(), route.getName(), route.isActive(), out);
    }
}
