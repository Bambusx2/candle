package com.candleshop.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartRequest {
    
    @NotNull(message = "Cart items are required")
    @Valid
    private List<CartItemRequest> items = new ArrayList<>();
} 