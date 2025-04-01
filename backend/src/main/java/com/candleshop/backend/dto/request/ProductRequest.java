package com.candleshop.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 100, message = "Product name must be between 3 and 100 characters")
    private String name;
    
    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;
    
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;
    
    private String imageUrl;
    
    @NotNull(message = "Category ID is required")
    private Long categoryId;
    
    private String scent;
    
    private String burnTime;
    
    private String size;
    
    private Double weight;
    
    @NotBlank(message = "Stock status is required")
    private String stockStatus;
    
    private Double rating;
    
    private Integer reviewCount;
    
    private boolean featured;
    
    private boolean newArrival;
    
    private boolean bestSeller;
} 