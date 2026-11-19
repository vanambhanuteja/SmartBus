package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.service.CrowdReportService;
import com.nie.smartbus.service.AdminAuditService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crowd-reports")
public class CrowdReportController {
    private final CrowdReportService service;
    private final AdminAuditService audit;
    public CrowdReportController(CrowdReportService service,AdminAuditService audit) { this.service = service; this.audit=audit; }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CrowdReportDto submit(@Valid @RequestBody CrowdReportRequest r, Principal principal) {
        return service.submit(r, principal.getName());
    }

    /** Authenticated users can see previous reports, optionally filtered by ?routeId= */
    @GetMapping
    public List<CrowdReportDto> list(@RequestParam(required = false) Long routeId) { return service.list(routeId); }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)   // ADMIN only (see SecurityConfig)
    public void delete(@PathVariable Long id,Principal p) { service.delete(id); audit.record(p.getName(),"DELETE","crowd_report",id.toString(),null); }
}
