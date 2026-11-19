package com.nie.smartbus.repository;

import com.nie.smartbus.entity.Prediction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findTop10ByRouteIdOrderByCreatedAtDesc(Long routeId);
}
