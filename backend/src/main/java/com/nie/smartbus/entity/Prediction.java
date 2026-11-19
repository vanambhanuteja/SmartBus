package com.nie.smartbus.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
public class Prediction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "prediction_id") private Long id;
    @Column(name = "route_id", nullable = false) private Long routeId;
    @Column(name = "travel_time", nullable = false) private String travelTime;
    @Column(name = "day_of_week", nullable = false) private int dayOfWeek;
    @Column(name = "predicted_percent", nullable = false) private float predictedPercent;
    @Column(name = "crowd_level", nullable = false) private String crowdLevel;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long v) { this.routeId = v; }
    public String getTravelTime() { return travelTime; }
    public void setTravelTime(String v) { this.travelTime = v; }
    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int v) { this.dayOfWeek = v; }
    public float getPredictedPercent() { return predictedPercent; }
    public void setPredictedPercent(float v) { this.predictedPercent = v; }
    public String getCrowdLevel() { return crowdLevel; }
    public void setCrowdLevel(String v) { this.crowdLevel = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
