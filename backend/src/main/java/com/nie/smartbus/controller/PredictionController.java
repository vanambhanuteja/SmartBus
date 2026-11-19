package com.nie.smartbus.controller;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.Prediction;
import com.nie.smartbus.service.PredictionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {
    private final PredictionService service;
    public PredictionController(PredictionService service) { this.service = service; }

    @PostMapping
    public PredictionDto predict(@Valid @RequestBody PredictionRequest r) { return service.predict(r); }

    @GetMapping("/{routeId}")
    public List<Prediction> recent(@PathVariable Long routeId) { return service.recentFor(routeId); }
}
