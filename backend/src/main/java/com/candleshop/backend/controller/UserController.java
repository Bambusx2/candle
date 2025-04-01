package com.candleshop.backend.controller;

import com.candleshop.backend.dto.AddressDTO;
import com.candleshop.backend.dto.UserDTO;
import com.candleshop.backend.dto.request.AddressRequest;
import com.candleshop.backend.dto.request.UpdateUserRequest;
import com.candleshop.backend.dto.response.ApiResponse;
import com.candleshop.backend.model.Address;
import com.candleshop.backend.model.Role;
import com.candleshop.backend.model.User;
import com.candleshop.backend.repository.AddressRepository;
import com.candleshop.backend.repository.UserRepository;
import com.candleshop.backend.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AddressRepository addressRepository;
    
    // Get current user profile
    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            logger.error("User details are null in getCurrentUserProfile. Authentication failed.");
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
        }
        
        logger.info("Fetching profile for user ID: {}, Email: {}", userDetails.getId(), userDetails.getEmail());
        
        Optional<User> user = userRepository.findById(userDetails.getId());
        if (user.isPresent()) {
            UserDTO userDTO = convertToDTO(user.get());
            return ResponseEntity.ok(userDTO);
        } else {
            logger.error("User with ID {} not found in database", userDetails.getId());
            return ResponseEntity.notFound().build();
        }
    }
    
    // Update current user profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody UpdateUserRequest updateRequest) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in updateUserProfile. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            logger.info("Updating profile for user ID: {}, Email: {}", userDetails.getId(), userDetails.getEmail());
            logger.debug("Update request: {}", updateRequest);
            
            Optional<User> userOpt = userRepository.findById(userDetails.getId());
            if (!userOpt.isPresent()) {
                logger.error("User with ID {} not found in database", userDetails.getId());
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // Update user fields
            if (updateRequest.getFirstName() != null) {
                user.setFirstName(updateRequest.getFirstName());
            }
            
            if (updateRequest.getLastName() != null) {
                user.setLastName(updateRequest.getLastName());
            }
            
            if (updateRequest.getPhoneNumber() != null) {
                user.setPhoneNumber(updateRequest.getPhoneNumber());
            }
            
            // Handle address update if provided
            if (updateRequest.getAddress() != null) {
                // Log that we're handling an address update
                logger.info("Address update request detected: {}", updateRequest.getAddress());
                
                // Create or update the address
                Address address;
                boolean addressExists = false;
                
                // Check if user already has a default address
                for (Address existingAddress : user.getAddresses()) {
                    if (existingAddress.isDefault()) {
                        address = existingAddress;
                        addressExists = true;
                        
                        // Update existing address
                        address.setStreet(updateRequest.getAddress().getStreet());
                        address.setCity(updateRequest.getAddress().getCity());
                        address.setState(updateRequest.getAddress().getState());
                        address.setPostalCode(updateRequest.getAddress().getPostalCode());
                        address.setCountry(updateRequest.getAddress().getCountry());
                        
                        // Save the updated address
                        addressRepository.save(address);
                        logger.info("Updated existing default address with ID: {}", address.getId());
                        break;
                    }
                }
                
                // If no default address exists, create a new one
                if (!addressExists) {
                    address = new Address();
                    address.setUser(user);
                    address.setStreet(updateRequest.getAddress().getStreet());
                    address.setCity(updateRequest.getAddress().getCity());
                    address.setState(updateRequest.getAddress().getState());
                    address.setPostalCode(updateRequest.getAddress().getPostalCode());
                    address.setCountry(updateRequest.getAddress().getCountry());
                    address.setDefault(true);
                    address.setAddressType("SHIPPING");
                    
                    // Add new address to user
                    user.addAddress(address);
                    
                    // Save the new address
                    addressRepository.save(address);
                    logger.info("Created new default address with ID: {}", address.getId());
                }
            }
            
            // Save updated user
            User updatedUser = userRepository.save(user);
            logger.info("Successfully updated user profile for user ID: {}", userDetails.getId());
            
            return ResponseEntity.ok(convertToDTO(updatedUser));
        } catch (Exception e) {
            logger.error("Failed to update profile for user with error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }
    
    // Get user by ID (admin only)
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            UserDTO userDTO = convertToDTO(user.get());
            return ResponseEntity.ok(userDTO);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Get all users (admin only)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(userDTOs);
    }
    
    // Get user addresses
    @GetMapping("/addresses")
    public ResponseEntity<List<AddressDTO>> getUserAddresses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        if (userDetails == null) {
            logger.error("User details are null in getUserAddresses. Authentication failed.");
            return ResponseEntity.status(401).build();
        }
        
        List<Address> addresses = addressRepository.findByUserId(userDetails.getId());
        List<AddressDTO> addressDTOs = addresses.stream()
                .map(this::convertAddressToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(addressDTOs);
    }
    
    // Add a new address for current user
    @PostMapping("/addresses")
    public ResponseEntity<?> addUserAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody AddressRequest addressRequest) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in addUserAddress. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            Optional<User> userOpt = userRepository.findById(userDetails.getId());
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            // Handle default address
            if (addressRequest.isDefault()) {
                // Reset any existing default addresses for this user
                List<Address> userAddresses = addressRepository.findByUserId(user.getId());
                userAddresses.forEach(address -> {
                    if (address.isDefault()) {
                        address.setDefault(false);
                        addressRepository.save(address);
                    }
                });
            } else {
                // If this is the first address for the user, make it default
                if (addressRepository.findByUserId(user.getId()).isEmpty()) {
                    addressRequest.setDefault(true);
                }
            }
            
            Address address = new Address();
            address.setUser(user);
            address.setStreet(addressRequest.getStreet());
            address.setCity(addressRequest.getCity());
            address.setState(addressRequest.getState());
            address.setPostalCode(addressRequest.getPostalCode());
            address.setCountry(addressRequest.getCountry());
            address.setDefault(addressRequest.isDefault());
            address.setAddressType(addressRequest.getAddressType());
            
            Address savedAddress = addressRepository.save(address);
            
            return ResponseEntity.ok(ApiResponse.success("Address added successfully", convertAddressToDTO(savedAddress)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Update an address
    @PutMapping("/addresses/{id}")
    public ResponseEntity<?> updateAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest addressRequest) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in updateAddress. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            Optional<Address> addressOpt = addressRepository.findById(id);
            if (!addressOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Address address = addressOpt.get();
            
            // Check if the address belongs to the current user
            if (!address.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(403).body(ApiResponse.error("You don't have permission to update this address"));
            }
            
            // Handle default address
            if (addressRequest.isDefault() && !address.isDefault()) {
                // Reset any existing default addresses for this user
                List<Address> userAddresses = addressRepository.findByUserId(userDetails.getId());
                userAddresses.forEach(a -> {
                    if (a.isDefault() && !a.getId().equals(id)) {
                        a.setDefault(false);
                        addressRepository.save(a);
                    }
                });
            }
            
            address.setStreet(addressRequest.getStreet());
            address.setCity(addressRequest.getCity());
            address.setState(addressRequest.getState());
            address.setPostalCode(addressRequest.getPostalCode());
            address.setCountry(addressRequest.getCountry());
            address.setDefault(addressRequest.isDefault());
            address.setAddressType(addressRequest.getAddressType());
            
            Address updatedAddress = addressRepository.save(address);
            
            return ResponseEntity.ok(ApiResponse.success("Address updated successfully", convertAddressToDTO(updatedAddress)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Delete an address
    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        try {
            if (userDetails == null) {
                logger.error("User details are null in deleteAddress. Authentication failed.");
                return ResponseEntity.status(401).body(ApiResponse.error("Authentication failed. Please log in again."));
            }
            
            Optional<Address> addressOpt = addressRepository.findById(id);
            if (!addressOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Address address = addressOpt.get();
            
            // Check if the address belongs to the current user
            if (!address.getUser().getId().equals(userDetails.getId())) {
                return ResponseEntity.status(403).body(ApiResponse.error("You don't have permission to delete this address"));
            }
            
            addressRepository.delete(address);
            
            // If the deleted address was the default, set a new default if other addresses exist
            if (address.isDefault()) {
                List<Address> userAddresses = addressRepository.findByUserId(userDetails.getId());
                if (!userAddresses.isEmpty()) {
                    Address newDefault = userAddresses.get(0);
                    newDefault.setDefault(true);
                    addressRepository.save(newDefault);
                }
            }
            
            return ResponseEntity.ok(ApiResponse.success("Address deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    // Convert User entity to UserDTO
    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAccountEnabled(user.isAccountEnabled());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        
        // Convert roles to strings
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
        dto.setRoles(roleNames);
        
        // Find and include default address if it exists
        if (user.getAddresses() != null && !user.getAddresses().isEmpty()) {
            for (Address address : user.getAddresses()) {
                if (address.isDefault()) {
                    dto.setAddress(convertAddressToDTO(address));
                    break;
                }
            }
        }
        
        return dto;
    }
    
    // Convert Address entity to AddressDTO
    private AddressDTO convertAddressToDTO(Address address) {
        AddressDTO dto = new AddressDTO();
        dto.setId(address.getId());
        dto.setUserId(address.getUser().getId());
        dto.setStreet(address.getStreet());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setPostalCode(address.getPostalCode());
        dto.setCountry(address.getCountry());
        dto.setDefault(address.isDefault());
        dto.setAddressType(address.getAddressType());
        dto.setCreatedAt(address.getCreatedAt());
        dto.setUpdatedAt(address.getUpdatedAt());
        
        return dto;
    }
} 