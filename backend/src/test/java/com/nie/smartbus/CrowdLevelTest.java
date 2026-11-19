package com.nie.smartbus;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.nie.smartbus.entity.CrowdLevel;
import org.junit.jupiter.api.Test;

class CrowdLevelTest {
    @Test
    void thresholdsMatchPredictionService() {
        assertEquals(CrowdLevel.LOW, CrowdLevel.fromPercent(30));
        assertEquals(CrowdLevel.MODERATE, CrowdLevel.fromPercent(31));
        assertEquals(CrowdLevel.HIGH, CrowdLevel.fromPercent(85));
        assertEquals(CrowdLevel.OVERCROWDED, CrowdLevel.fromPercent(86));
    }
}
