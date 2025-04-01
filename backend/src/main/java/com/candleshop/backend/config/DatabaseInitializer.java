package com.candleshop.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

@Configuration
public class DatabaseInitializer {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private DataSource dataSource;
    
    @Bean
    public CommandLineRunner initDatabase() {
        return args -> {
            try {
                // Check if the categories table is empty
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM candle_category", Integer.class);
                
                if (count != null && count == 0) {
                    logger.info("Database is empty, initializing with default data...");
                    
                    // Load and execute the data.sql script
                    ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
                    populator.addScript(new ClassPathResource("data.sql"));
                    populator.execute(dataSource);
                    
                    logger.info("Database initialized successfully!");
                } else {
                    logger.info("Database already contains data, skipping initialization.");
                }
            } catch (Exception e) {
                // Table might not exist yet, which is fine during first run
                logger.info("Could not check database state: {}", e.getMessage());
                logger.info("This is normal during first run when tables are being created.");
            }
        };
    }
} 