package com.nie.smartbus.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "route_stops")
@IdClass(RouteStopId.class)
public class RouteStop {
    @Id @Column(name = "route_id") private Long routeId;
    @Id @Column(name = "stop_id") private Long stopId;
    @Column(name = "stop_sequence", nullable = false) private int stopSequence;

    public RouteStop() { }
    public RouteStop(Long routeId, Long stopId, int stopSequence) {
        this.routeId = routeId; this.stopId = stopId; this.stopSequence = stopSequence;
    }
    public Long getRouteId() { return routeId; }
    public Long getStopId() { return stopId; }
    public int getStopSequence() { return stopSequence; }
}
