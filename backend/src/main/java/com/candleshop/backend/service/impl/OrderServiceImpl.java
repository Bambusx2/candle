package com.candleshop.backend.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.candleshop.backend.dto.AddressDTO;
import com.candleshop.backend.dto.CreateOrderRequest;
import com.candleshop.backend.dto.OrderDTO;
import com.candleshop.backend.dto.OrderItemDTO;
import com.candleshop.backend.dto.OrderSummaryDTO;
import com.candleshop.backend.dto.ProductDTO;
import com.candleshop.backend.mapper.AddressMapper;
import com.candleshop.backend.model.Address;
import com.candleshop.backend.model.Cart;
import com.candleshop.backend.model.CartItem;
import com.candleshop.backend.model.Order;
import com.candleshop.backend.model.OrderItem;
import com.candleshop.backend.model.OrderStatus;
import com.candleshop.backend.model.PaymentMethod;
import com.candleshop.backend.model.Product;
import com.candleshop.backend.model.User;
import com.candleshop.backend.repository.CartRepository;
import com.candleshop.backend.repository.OrderRepository;
import com.candleshop.backend.repository.ProductRepository;
import com.candleshop.backend.repository.UserRepository;
import com.candleshop.backend.service.OrderService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private AddressMapper addressMapper;
    
    @Override
    public List<OrderDTO> getUserOrders(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        List<Order> orders = orderRepository.findByUserOrderByOrderDateDesc(user);
        
        return orders.stream()
                .map(this::mapToOrderDTO)
                .collect(Collectors.toList());
    }

    @Override
    public OrderDTO getOrderById(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Validate the order belongs to the user
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to access this order");
        }
        
        return mapToOrderDTO(order);
    }

    @Override
    @Transactional
    public OrderDTO createOrder(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Cart not found"));
        
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot create order with empty cart");
        }
        
        // Create order
        Order order = new Order();
        order.setUser(user);
        order.setPaymentMethod(request.getPaymentMethod());
        
        // Create new addresses based on DTO data rather than using addressMapper.toEntity
        Address shippingAddress = new Address();
        AddressDTO shippingDTO = request.getShippingAddress();
        shippingAddress.setStreet(shippingDTO.getStreet());
        shippingAddress.setCity(shippingDTO.getCity());
        shippingAddress.setState(shippingDTO.getState());
        shippingAddress.setPostalCode(shippingDTO.getPostalCode());
        shippingAddress.setCountry(shippingDTO.getCountry());
        shippingAddress.setAddressType("SHIPPING");
        shippingAddress.setDefault(true);
        shippingAddress.setUser(user);
        
        order.setShippingAddress(shippingAddress);
        
        // Set billing address
        Address billingAddress;
        if (request.getUseShippingAsBilling()) {
            billingAddress = new Address();
            billingAddress.setStreet(shippingDTO.getStreet());
            billingAddress.setCity(shippingDTO.getCity());
            billingAddress.setState(shippingDTO.getState());
            billingAddress.setPostalCode(shippingDTO.getPostalCode());
            billingAddress.setCountry(shippingDTO.getCountry());
            billingAddress.setAddressType("BILLING");
            billingAddress.setDefault(true);
            billingAddress.setUser(user);
        } else {
            billingAddress = new Address();
            AddressDTO billingDTO = request.getBillingAddress();
            billingAddress.setStreet(billingDTO.getStreet());
            billingAddress.setCity(billingDTO.getCity());
            billingAddress.setState(billingDTO.getState());
            billingAddress.setPostalCode(billingDTO.getPostalCode());
            billingAddress.setCountry(billingDTO.getCountry());
            billingAddress.setAddressType("BILLING");
            billingAddress.setDefault(true);
            billingAddress.setUser(user);
        }
        order.setBillingAddress(billingAddress);
        
        // Save the order to get an ID
        order = orderRepository.save(order);
        
        // Create order items from cart
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            
            // Fix BigDecimal to Double conversion
            orderItem.setPrice(product.getPrice().doubleValue());
            orderItem.setProductName(product.getName());
            orderItem.setProductImageUrl(product.getImageUrl());
            
            order.getItems().add(orderItem);
        }
        
        // Calculate totals
        order.calculateTotals();
        
        // Save the order with items
        order = orderRepository.save(order);
        
        // Clear the cart
        cart.getItems().clear();
        cartRepository.save(cart);
        
        return mapToOrderDTO(order);
    }

    @Override
    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        order.setStatus(status);
        
        // Generate tracking number if the order is being shipped
        if (status == OrderStatus.SHIPPED && order.getTrackingNumber() == null) {
            order.setTrackingNumber(generateTrackingNumber());
        }
        
        order = orderRepository.save(order);
        
        return mapToOrderDTO(order);
    }

    @Override
    @Transactional
    public OrderDTO cancelOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Validate the order belongs to the user
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to access this order");
        }
        
        // Only pending orders can be cancelled
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalArgumentException("Only pending orders can be cancelled");
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);
        
        return mapToOrderDTO(order);
    }

    @Override
    public OrderDTO trackOrder(Long orderId, Long userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found"));
        
        // Validate the order belongs to the user
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized to access this order");
        }
        
        // In a real application, we would call a shipping API here
        // For now, just return the order with its current status
        
        return mapToOrderDTO(order);
    }
    
    private String generateTrackingNumber() {
        // Generate a random tracking number
        return "TRK" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private OrderDTO mapToOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setId(order.getId());
        dto.setUserId(order.getUser().getId());
        dto.setUserName(order.getUser().getFirstName() + " " + order.getUser().getLastName());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setTrackingNumber(order.getTrackingNumber());
        
        // Map addresses
        if (order.getShippingAddress() != null) {
            dto.setShippingAddress(addressMapper.toDto(order.getShippingAddress()));
        }
        
        if (order.getBillingAddress() != null) {
            dto.setBillingAddress(addressMapper.toDto(order.getBillingAddress()));
        }
        
        // Map items
        List<OrderItemDTO> itemDTOs = order.getItems().stream()
                .map(this::mapToOrderItemDTO)
                .collect(Collectors.toList());
        dto.setItems(itemDTOs);
        
        // Map summary
        OrderSummaryDTO summary = new OrderSummaryDTO();
        summary.setSubtotal(order.getSubtotal());
        summary.setShipping(order.getShippingCost());
        summary.setTax(order.getTax());
        summary.setTotal(order.getTotal());
        summary.setDiscounts(0.0); // Not implemented yet
        dto.setSummary(summary);
        
        return dto;
    }
    
    private OrderItemDTO mapToOrderItemDTO(OrderItem item) {
        OrderItemDTO dto = new OrderItemDTO();
        dto.setId(item.getId());
        dto.setQuantity(item.getQuantity());
        dto.setPrice(item.getPrice());
        
        // Map product
        ProductDTO productDTO = new ProductDTO();
        Product product = item.getProduct();
        if (product != null) {
            productDTO.setId(product.getId());
            productDTO.setName(product.getName());
            
            // Fix Double to BigDecimal conversion
            productDTO.setPrice(BigDecimal.valueOf(item.getPrice()));
            productDTO.setImageUrl(product.getImageUrl());
        } else {
            // Use stored product details if product entity is no longer available
            productDTO.setName(item.getProductName());
            productDTO.setImageUrl(item.getProductImageUrl());
            
            // Fix Double to BigDecimal conversion
            productDTO.setPrice(BigDecimal.valueOf(item.getPrice()));
        }
        
        dto.setProduct(productDTO);
        
        return dto;
    }
} 