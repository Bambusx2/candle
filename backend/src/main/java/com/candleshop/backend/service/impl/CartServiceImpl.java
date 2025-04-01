package com.candleshop.backend.service.impl;

import com.candleshop.backend.dto.CartDTO;
import com.candleshop.backend.dto.CartItemDTO;
import com.candleshop.backend.dto.ProductDTO;
import com.candleshop.backend.dto.request.CartItemRequest;
import com.candleshop.backend.dto.request.CartRequest;
import com.candleshop.backend.mapper.ProductMapper;
import com.candleshop.backend.model.Cart;
import com.candleshop.backend.model.CartItem;
import com.candleshop.backend.model.Product;
import com.candleshop.backend.model.User;
import com.candleshop.backend.repository.CartItemRepository;
import com.candleshop.backend.repository.CartRepository;
import com.candleshop.backend.repository.ProductRepository;
import com.candleshop.backend.service.CartService;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartServiceImpl.class);
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private CartItemRepository cartItemRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ProductMapper productMapper;

    @Override
    @Transactional
    public CartDTO getOrCreateCart(User user) {
        logger.info("Getting or creating cart for user ID: {}", user.getId());
        
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    logger.info("Creating new cart for user ID: {}", user.getId());
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
        
        // Check for and fix duplicate products 
        int fixedCount = fixDuplicateProductsInCart(cart.getId());
        if (fixedCount > 0) {
            logger.info("Fixed {} duplicate items in cart", fixedCount);
            // Get a fresh copy of the cart with the fixed items
            cart = cartRepository.findByIdWithItems(cart.getId())
                .orElseThrow(() -> new EntityNotFoundException("Cart not found after fixing duplicates"));
        }
        
        return convertToDTO(cart);
    }

    @Override
    @Transactional
    public CartDTO updateCart(User user, CartRequest cartRequest) {
        logger.info("Updating cart for user ID: {}", user.getId());
        
        // Get or create the user's cart
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    logger.info("Creating new cart for user ID: {}", user.getId());
                    Cart newCart = new Cart();
                    newCart.setUser(user);
                    return cartRepository.save(newCart);
                });
        
        // Log current items in cart
        logger.info("Current cart has {} items", cart.getItems().size());
        
        // Verify all requested products exist
        List<Long> requestedProductIds = cartRequest.getItems().stream()
                .map(CartItemRequest::getProductId)
                .collect(Collectors.toList());
        
        // Load all products in a single query
        List<Product> products = productRepository.findAllById(requestedProductIds);
        if (products.size() != requestedProductIds.size()) {
            throw new EntityNotFoundException("One or more products not found");
        }
        
        // Map product IDs to products for easy lookup
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
                
        // First, delete all existing cart items to avoid duplicates
        int deletedCount = cartItemRepository.deleteByCartId(cart.getId());
        logger.info("Deleted {} existing cart items before update", deletedCount);
        
        // Create new items for each product in the request
        List<CartItem> newItems = new ArrayList<>();
        for (CartItemRequest itemRequest : cartRequest.getItems()) {
            Product product = productMap.get(itemRequest.getProductId());
            
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(itemRequest.getQuantity());
            newItems.add(newItem);
        }
        
        // Save all the new items in batch
        List<CartItem> savedItems = cartItemRepository.saveAll(newItems);
        logger.info("Added {} new items to cart", savedItems.size());
        
        // Get a fresh copy of the cart with the updated items
        Cart updatedCart = cartRepository.findByIdWithItems(cart.getId())
                .orElseThrow(() -> new EntityNotFoundException("Cart not found after update"));
        
        // Convert to DTO and return
        return convertToDTO(updatedCart);
    }

    @Override
    @Transactional
    public void clearCart(User user) {
        logger.info("Clearing cart for user ID: {}", user.getId());
        
        try {
            Optional<Cart> optionalCart = cartRepository.findByUserId(user.getId());
            if (optionalCart.isPresent()) {
                Cart cart = optionalCart.get();
                Long cartId = cart.getId();
                
                // Step 1: Delete all items in database directly with JPQL query
                int deletedCount = cartItemRepository.deleteByCartId(cartId);
                logger.info("Deleted {} cart items in database for cart ID: {}", deletedCount, cartId);
                
                // Step 2: Get a fresh cart from the database
                cart = cartRepository.findByIdWithItems(cartId)
                    .orElseThrow(() -> new EntityNotFoundException("Cart not found after clearing"));
                
                // The cart should now have no items
                if (!cart.getItems().isEmpty()) {
                    logger.warn("Cart still has {} items after deletion - forcing clear", cart.getItems().size());
                    cart.getItems().clear();
                    cartRepository.save(cart);
                }
                
                logger.info("Successfully cleared cart for user ID: {}", user.getId());
            } else {
                logger.info("No cart found for user ID: {}", user.getId());
            }
        } catch (Exception e) {
            logger.error("Error clearing cart for user ID {}: {}", user.getId(), e.getMessage(), e);
            throw e; // Re-throw to allow transaction to be rolled back
        }
    }
    
    /**
     * Convert Cart entity to CartDTO
     */
    private CartDTO convertToDTO(Cart cart) {
        CartDTO cartDTO = new CartDTO();
        cartDTO.setId(cart.getId());
        cartDTO.setUserId(cart.getUser().getId());
        
        List<CartItemDTO> itemDTOs = cart.getItems().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        cartDTO.setItems(itemDTOs);
        return cartDTO;
    }
    
    /**
     * Convert CartItem entity to CartItemDTO
     */
    private CartItemDTO convertToDTO(CartItem cartItem) {
        CartItemDTO itemDTO = new CartItemDTO();
        itemDTO.setId(cartItem.getId());
        itemDTO.setQuantity(cartItem.getQuantity());
        
        // Convert product using ProductMapper
        ProductDTO productDTO = productMapper.toDto(cartItem.getProduct());
        itemDTO.setProduct(productDTO);
        
        return itemDTO;
    }

    /**
     * Detect and fix duplicate products in a cart.
     * This method finds all product IDs that have multiple cart items,
     * consolidates them into a single item, and deletes the others.
     * 
     * @param cartId the ID of the cart to check
     * @return the number of duplicate items fixed
     */
    @Transactional
    private int fixDuplicateProductsInCart(Long cartId) {
        int fixedCount = 0;
        
        // Find products with duplicate entries
        List<Object[]> duplicates = cartItemRepository.findDuplicateProductsInCart(cartId);
        if (duplicates.isEmpty()) {
            logger.info("No duplicate products found in cart ID: {}", cartId);
            return 0;
        }
        
        logger.info("Found {} products with duplicates in cart ID: {}", duplicates.size(), cartId);
        
        for (Object[] result : duplicates) {
            Long productId = (Long) result[0];
            Long count = (Long) result[1];
            
            logger.info("Product ID: {} has {} duplicate entries", productId, count);
            
            // Get all cart items for this product using the repository method
            List<CartItem> items = cartItemRepository.findByCartIdAndProductId(cartId, productId);
            
            if (items.size() > 1) {
                // Keep the first item and consolidate quantities
                CartItem keepItem = items.get(0);
                int totalQuantity = 0;
                
                for (CartItem item : items) {
                    totalQuantity += item.getQuantity();
                    
                    // Delete all except the first one
                    if (item.getId() != keepItem.getId()) {
                        cartItemRepository.delete(item);
                        fixedCount++;
                    }
                }
                
                // Update the quantity of the kept item
                keepItem.setQuantity(totalQuantity);
                cartItemRepository.save(keepItem);
                
                logger.info("Consolidated {} items of product ID: {} into a single entry with quantity: {}", 
                           items.size(), productId, totalQuantity);
            }
        }
        
        return fixedCount;
    }
} 