package com.nie.smartbus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class SmartBusApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartBusApplication.class, args);
    }
}
