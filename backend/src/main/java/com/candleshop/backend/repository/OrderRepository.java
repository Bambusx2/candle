package com.candleshop.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.candleshop.backend.model.Order;
import com.candleshop.backend.model.User;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByUserOrderByOrderDateDesc(User user);
    
    List<Order> findByUser_IdOrderByOrderDateDesc(Long userId);
    
} 