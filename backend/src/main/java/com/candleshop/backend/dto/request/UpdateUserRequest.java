package com.candleshop.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    
    private String firstName;
    
    private String lastName;
    
    private String phoneNumber;
    
    private AddressRequest address;
    
    // Note: Email is not included as it cannot be changed by the user
} 