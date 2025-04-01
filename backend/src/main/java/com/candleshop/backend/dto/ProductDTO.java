package com.candleshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    
    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private String scent;
    private String burnTime;
    private String size;
    private Double weight;
    private String stockStatus;
    private Double rating;
    private Integer reviewCount;
    private boolean featured;
    private boolean newArrival;
    private boolean bestSeller;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 