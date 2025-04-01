package com.candleshop.backend.service;

import java.util.List;

import com.candleshop.backend.dto.CreateOrderRequest;
import com.candleshop.backend.dto.OrderDTO;
import com.candleshop.backend.model.OrderStatus;

public interface OrderService {
    
    List<OrderDTO> getUserOrders(Long userId);
    
    OrderDTO getOrderById(Long orderId, Long userId);
    
    OrderDTO createOrder(Long userId, CreateOrderRequest request);
    
    OrderDTO updateOrderStatus(Long orderId, OrderStatus status);
    
    OrderDTO cancelOrder(Long orderId, Long userId);
    
    OrderDTO trackOrder(Long orderId, Long userId);
    
} 