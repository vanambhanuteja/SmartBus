package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.service.RouteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
public class RouteController {
    private final RouteService service;
    public RouteController(RouteService service) { this.service = service; }

    @GetMapping public List<RouteDto> list() { return service.list(); }
    @GetMapping("/{id}") public RouteDto get(@PathVariable Long id) { return service.get(id); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public RouteDto create(@Valid @RequestBody RouteRequest r) { return service.create(r); }

    @PutMapping("/{id}")
    public RouteDto update(@PathVariable Long id, @Valid @RequestBody RouteRequest r) { return service.update(id, r); }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
