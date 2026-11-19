package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.DashboardDto;
import com.nie.smartbus.service.AdminService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }

    @GetMapping("/dashboard")
    public DashboardDto dashboard() { return service.dashboard(); }
}
