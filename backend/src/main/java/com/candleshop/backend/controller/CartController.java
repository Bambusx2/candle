package com.candleshop.backend.controller;

import com.candleshop.backend.dto.CartDTO;
import com.candleshop.backend.dto.request.CartRequest;
import com.candleshop.backend.dto.response.ApiResponse;
import com.candleshop.backend.model.User;
import com.candleshop.backend.repository.UserRepository;
import com.candleshop.backend.security.UserDetailsImpl;
import com.candleshop.backend.service.CartService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/cart")
public class CartController {
    
    private static final Logger logger = LoggerFactory.getLogger(CartController.class);
    
    @Autowired
    private CartService cartService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Get current user's cart
     */
    @GetMapping
    public ResponseEntity<?> getCurrentUserCart(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in getCurrentUserCart. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            CartDTO cartDTO = cartService.getOrCreateCart(user);
            
            return ResponseEntity.ok(cartDTO);
        } catch (Exception e) {
            logger.error("Error getting user cart: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Update current user's cart
     */
    @PostMapping
    public ResponseEntity<?> updateCart(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody CartRequest cartRequest) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in updateCart. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            CartDTO updatedCart = cartService.updateCart(user, cartRequest);
            
            return ResponseEntity.ok(ApiResponse.success("Cart updated successfully", updatedCart));
        } catch (Exception e) {
            logger.error("Error updating user cart: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    /**
     * Clear current user's cart
     */
    @DeleteMapping
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in clearCart. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Try to clear the cart but catch any specific exceptions
            try {
                cartService.clearCart(user);
                return ResponseEntity.ok(ApiResponse.success("Cart cleared successfully"));
            } catch (Exception e) {
                logger.error("Specific error clearing cart: {}", e.getMessage(), e);
                return ResponseEntity.status(500).body(
                    ApiResponse.error("Error clearing cart: " + e.getMessage()));
            }
        } catch (Exception e) {
            logger.error("General error in clearCart endpoint: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
} 