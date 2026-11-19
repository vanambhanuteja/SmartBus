package com.nie.smartbus.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** All request/response objects in one place (records = simple immutable data classes). */
public final class Dtos {
    private Dtos() { }

    // ---- auth ----
    public record RegisterRequest(@NotBlank @Size(max = 100) String fullName,
                                  @NotBlank @Email @Size(max = 150) String email,
                                  @NotBlank @Size(min = 8, max = 72, message = "password must be 8-72 characters") String password) { }
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }
    public record AuthResponse(String token, String fullName, String email, String role) { }

    // ---- stops / routes / buses ----
    public record StopRequest(@NotBlank @Size(max = 100) String name,
                              @DecimalMin("-90") @DecimalMax("90") double latitude,
                              @DecimalMin("-180") @DecimalMax("180") double longitude) { }
    public record StopDto(Long id, String name, double latitude, double longitude) { }

    public record RouteRequest(@NotBlank @Size(max = 10) String routeCode,
                               @NotBlank @Size(max = 150) String name,
                               boolean active,
                               @NotEmpty List<Long> stopIds) { }
    public record RouteDto(Long id, String routeCode, String name, boolean active, List<StopDto> stops) { }

    public record BusRequest(@NotBlank @Size(max = 20) String registration,
                             @Min(1) @Max(200) int capacity, boolean active) { }
    public record BusDto(Long id, String registration, int capacity, boolean active) { }

    // ---- crowd reports ----
    public record CrowdReportRequest(@NotNull Long routeId, Long tripId,
                                     @NotBlank @Pattern(regexp = "LOW|MODERATE|HIGH|OVERCROWDED",
                                             message = "crowdLevel must be LOW, MODERATE, HIGH or OVERCROWDED") String crowdLevel,
                                     @Size(max = 255) String note) { }
    public record CrowdReportDto(Long id, Long routeId, Long tripId, int occupancyPercent, String crowdLevel,
                                 String source, String note, LocalDateTime reportedAt) { }

    // ---- predictions ----
    public record PredictionRequest(@NotNull Long routeId,
                                    @NotBlank @Pattern(regexp = "^([01]?\\d|2[0-3]):[0-5]\\d$", message = "travelTime must be HH:MM") String travelTime,
                                    @Min(0) @Max(6) Integer dayOfWeek) { }
    public record PredictionDto(Long routeId, String routeName, double predictedOccupancyPercent, String crowdLevel,
                                String travelTime, int dayOfWeek, LocalDateTime predictionTimestamp,
                                Double recentReportsAvg, String dataSource) { }

    // ---- admin ----
    public record DashboardDto(long totalRoutes, long totalBuses, long totalStops, long totalReports,
                               Map<String, Long> crowdDistribution, Map<String, Long> reportsBySource,
                               Map<Integer, Double> averageOccupancyByHour) { }
}
