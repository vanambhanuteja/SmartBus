package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.service.RouteService;
import com.nie.smartbus.service.AdminAuditService;
import jakarta.validation.Valid;
import java.util.List;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/routes")
public class RouteController {
    private final RouteService service;
    private final AdminAuditService audit;
    public RouteController(RouteService service,AdminAuditService audit) { this.service = service; this.audit=audit; }

    @GetMapping public List<RouteDto> list() { return service.list(); }
    @GetMapping("/{id}") public RouteDto get(@PathVariable Long id) { return service.get(id); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public RouteDto create(@Valid @RequestBody RouteRequest r,Principal p) { var out=service.create(r); audit.record(p.getName(),"CREATE","route",out.id().toString(),out.routeCode()); return out; }

    @PutMapping("/{id}")
    public RouteDto update(@PathVariable Long id, @Valid @RequestBody RouteRequest r,Principal p) { var out=service.update(id, r); audit.record(p.getName(),"UPDATE","route",id.toString(),out.routeCode()); return out; }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id,Principal p) { service.delete(id); audit.record(p.getName(),"DELETE","route",id.toString(),null); }
}
