package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.BusStop;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.BusStopRepository;
import com.nie.smartbus.repository.RouteStopRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stops")
public class StopController {
    private final BusStopRepository stops;
    private final RouteStopRepository routeStops;
    public StopController(BusStopRepository stops, RouteStopRepository routeStops) { this.stops = stops; this.routeStops = routeStops; }

    private static StopDto dto(BusStop s) { return new StopDto(s.getId(), s.getName(), s.getLatitude(), s.getLongitude()); }
    private static void apply(BusStop s, StopRequest r) { s.setName(r.name().trim()); s.setLatitude(r.latitude()); s.setLongitude(r.longitude()); }

    @GetMapping public List<StopDto> list() { return stops.findAll().stream().map(StopController::dto).toList(); }

    @GetMapping("/{id}")
    public StopDto get(@PathVariable Long id) { return dto(stops.findById(id).orElseThrow(() -> ApiException.notFound("Stop"))); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public StopDto create(@Valid @RequestBody StopRequest r) { BusStop s = new BusStop(); apply(s, r); return dto(stops.save(s)); }

    @PutMapping("/{id}")
    public StopDto update(@PathVariable Long id, @Valid @RequestBody StopRequest r) {
        BusStop s = stops.findById(id).orElseThrow(() -> ApiException.notFound("Stop"));
        apply(s, r);
        return dto(stops.save(s));
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
    public void delete(@PathVariable Long id) {
        if (!stops.existsById(id)) throw ApiException.notFound("Stop");
        routeStops.deleteByStopId(id);
        stops.deleteById(id);
    }
}
