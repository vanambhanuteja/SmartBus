package com.nie.smartbus.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "crowd_reports")
public class CrowdReport {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id") private Long id;
    @Column(name = "trip_id") private Long tripId;
    @Column(name = "route_id", nullable = false) private Long routeId;
    @Column(name = "user_id") private Long userId;
    @Column(name = "occupancy_percent", nullable = false) private int occupancyPercent;
    @Column(name = "crowd_level", nullable = false) private String crowdLevel;
    @Column(nullable = false) private String source = "PASSENGER";   // PASSENGER or SYNTHETIC
    private String note;
    @Column(name = "reported_at", nullable = false) private LocalDateTime reportedAt = LocalDateTime.now();
    @Column(nullable = false) private boolean flagged;

    public Long getId() { return id; }
    public Long getTripId() { return tripId; }
    public void setTripId(Long v) { this.tripId = v; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long v) { this.routeId = v; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { this.userId = v; }
    public int getOccupancyPercent() { return occupancyPercent; }
    public void setOccupancyPercent(int v) { this.occupancyPercent = v; }
    public String getCrowdLevel() { return crowdLevel; }
    public void setCrowdLevel(String v) { this.crowdLevel = v; }
    public String getSource() { return source; }
    public void setSource(String v) { this.source = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public LocalDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(LocalDateTime v) { this.reportedAt = v; }
    public boolean isFlagged() { return flagged; }
    public void setFlagged(boolean v) { this.flagged = v; }
}
