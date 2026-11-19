package com.nie.smartbus.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "buses")
public class Bus {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bus_id") private Long id;
    @Column(nullable = false, unique = true) private String registration;
    @Column(nullable = false) private int capacity;
    @Column(nullable = false) private boolean active = true;

    public Long getId() { return id; }
    public String getRegistration() { return registration; }
    public void setRegistration(String v) { this.registration = v; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int v) { this.capacity = v; }
    public boolean isActive() { return active; }
    public void setActive(boolean v) { this.active = v; }
}
