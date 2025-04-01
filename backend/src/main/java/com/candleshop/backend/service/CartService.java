package com.candleshop.backend.service;

import com.candleshop.backend.dto.CartDTO;
import com.candleshop.backend.dto.request.CartRequest;
import com.candleshop.backend.model.User;


public interface CartService {
    
    /**
     * Get or create a cart for a user
     */
    CartDTO getOrCreateCart(User user);
    
    /**
     * Update a user's cart with new items
     */
    CartDTO updateCart(User user, CartRequest cartRequest);
    
    /**
     * Clear all items from a user's cart
     */
    void clearCart(User user);
} 