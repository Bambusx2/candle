package com.candleshop.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Set<String> roles = new HashSet<>();
    private boolean accountEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private AddressDTO address; // Default address
} 