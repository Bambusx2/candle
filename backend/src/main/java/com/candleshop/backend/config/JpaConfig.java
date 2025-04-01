package com.candleshop.backend.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

import java.util.Optional;

@Configuration
@EnableJpaAuditing
@EntityScan(basePackages = "com.candleshop.backend.model")
@EnableJpaRepositories(basePackages = "com.candleshop.backend.repository")
public class JpaConfig {

    /**
     * Configure auditor provider for JPA auditing
     * Currently just returns empty as we don't need actual user tracking for dates
     */
    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> Optional.empty();
    }
} 