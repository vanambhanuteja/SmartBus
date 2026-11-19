package com.nie.smartbus.entity;

import java.io.Serializable;
import java.util.Objects;

/** Composite primary key (route_id, stop_id) for the route_stops join table. */
public class RouteStopId implements Serializable {
    private Long routeId;
    private Long stopId;

    public RouteStopId() { }
    public RouteStopId(Long routeId, Long stopId) { this.routeId = routeId; this.stopId = stopId; }

    @Override public boolean equals(Object o) {
        return o instanceof RouteStopId r && Objects.equals(routeId, r.routeId) && Objects.equals(stopId, r.stopId);
    }
    @Override public int hashCode() { return Objects.hash(routeId, stopId); }
}
