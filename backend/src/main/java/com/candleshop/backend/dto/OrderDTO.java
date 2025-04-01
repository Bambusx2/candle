package com.candleshop.backend.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.candleshop.backend.model.OrderStatus;
import com.candleshop.backend.model.PaymentMethod;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    
    private Long id;
    private Long userId;
    private String userName;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private AddressDTO shippingAddress;
    private AddressDTO billingAddress;
    private List<OrderItemDTO> items = new ArrayList<>();
    private OrderSummaryDTO summary;
    private String trackingNumber;
    
} 