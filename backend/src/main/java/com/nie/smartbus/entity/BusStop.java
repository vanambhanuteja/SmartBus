package com.nie.smartbus.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "bus_stops")
public class BusStop {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stop_id") private Long id;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private double latitude;
    @Column(nullable = false) private double longitude;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public double getLatitude() { return latitude; }
    public void setLatitude(double v) { this.latitude = v; }
    public double getLongitude() { return longitude; }
    public void setLongitude(double v) { this.longitude = v; }
}
