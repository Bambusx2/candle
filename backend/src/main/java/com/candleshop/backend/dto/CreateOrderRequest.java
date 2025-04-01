package com.candleshop.backend.dto;

import com.candleshop.backend.model.PaymentMethod;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    
    private AddressDTO shippingAddress;
    private AddressDTO billingAddress;
    private PaymentMethod paymentMethod;
    private Boolean useShippingAsBilling = false;
    
} 