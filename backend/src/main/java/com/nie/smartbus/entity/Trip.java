package com.nie.smartbus.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
public class Trip {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trip_id") private Long id;
    @Column(name = "route_id", nullable = false) private Long routeId;
    @Column(name = "bus_id", nullable = false) private Long busId;
    @Column(name = "departure_time", nullable = false) private LocalDateTime departureTime;

    public Long getId() { return id; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long v) { this.routeId = v; }
    public Long getBusId() { return busId; }
    public void setBusId(Long v) { this.busId = v; }
    public LocalDateTime getDepartureTime() { return departureTime; }
    public void setDepartureTime(LocalDateTime v) { this.departureTime = v; }
}
