package com.nie.smartbus.repository;

import com.nie.smartbus.entity.CrowdReport;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CrowdReportRepository extends JpaRepository<CrowdReport, Long> {
    List<CrowdReport> findTop50ByOrderByReportedAtDesc();
    List<CrowdReport> findTop50ByRouteIdOrderByReportedAtDesc(Long routeId);

    /** Average occupancy of real passenger reports since a given time (null if there are none). */
    @Query("select avg(r.occupancyPercent) from CrowdReport r where r.routeId = :routeId and r.source = 'PASSENGER' and r.reportedAt >= :since")
    Double averageRecentPassengerOccupancy(Long routeId, LocalDateTime since);

    @Query("select r.crowdLevel, count(r) from CrowdReport r group by r.crowdLevel")
    List<Object[]> countByCrowdLevel();

    @Query("select r.source, count(r) from CrowdReport r group by r.source")
    List<Object[]> countBySource();

    /** Historical analytics: average occupancy for each hour of the day. */
    @Query(value = "select extract(hour from reported_at) as h, avg(occupancy_percent) as a from crowd_reports group by extract(hour from reported_at) order by h", nativeQuery = true)
    List<Object[]> averageOccupancyByHour();
}
