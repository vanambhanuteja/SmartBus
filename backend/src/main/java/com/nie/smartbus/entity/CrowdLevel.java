package com.nie.smartbus.entity;

/** Crowd categories; midpoint is used when a passenger reports only a level. */
public enum CrowdLevel {
    LOW(15), MODERATE(45), HIGH(73), OVERCROWDED(93);

    private final int midpoint;
    CrowdLevel(int midpoint) { this.midpoint = midpoint; }
    public int getMidpoint() { return midpoint; }

    /** 0-30 Low, 31-60 Moderate, 61-85 High, 86-100 Overcrowded (same thresholds as the ML service). */
    public static CrowdLevel fromPercent(double p) {
        if (p <= 30) return LOW;
        if (p <= 60) return MODERATE;
        if (p <= 85) return HIGH;
        return OVERCROWDED;
    }
}
