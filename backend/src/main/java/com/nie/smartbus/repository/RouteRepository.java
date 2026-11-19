package com.nie.smartbus.repository;

import com.nie.smartbus.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRepository extends JpaRepository<Route, Long> {
    boolean existsByRouteCode(String routeCode);
}
