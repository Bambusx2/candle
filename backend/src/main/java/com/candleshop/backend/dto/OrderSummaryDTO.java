package com.candleshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryDTO {
    
    private Double subtotal;
    private Double shipping;
    private Double tax;
    private Double total;
    private Double discounts;
    private String couponCode;
    
} 