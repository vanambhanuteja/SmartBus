package com.nie.smartbus.repository;

import com.nie.smartbus.entity.RouteStop;
import com.nie.smartbus.entity.RouteStopId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteStopRepository extends JpaRepository<RouteStop, RouteStopId> {
    List<RouteStop> findByRouteIdOrderByStopSequence(Long routeId);
    void deleteByRouteId(Long routeId);
    void deleteByStopId(Long stopId);
}
