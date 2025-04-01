package com.candleshop.backend.repository;

import com.candleshop.backend.model.CandleCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandleCategoryRepository extends JpaRepository<CandleCategory, Long> {
    
    Optional<CandleCategory> findByName(String name);
    
    boolean existsByName(String name);
} 