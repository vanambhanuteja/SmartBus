package com.nie.smartbus.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "routes")
public class Route {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "route_id") private Long id;
    @Column(name = "route_code", nullable = false, unique = true) private String routeCode;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private boolean active = true;

    public Long getId() { return id; }
    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String v) { this.routeCode = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { this.active = v; }
}
