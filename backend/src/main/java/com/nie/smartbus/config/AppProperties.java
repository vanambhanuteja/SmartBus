package com.nie.smartbus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Reads the "smartbus.*" values from application.yml (which come from environment variables). */
@ConfigurationProperties(prefix = "smartbus")
public record AppProperties(String jwtSecret, int jwtExpiryMinutes, String predictionUrl,
                            String adminEmail, String adminPassword, String corsOrigins) {
}
