package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.UserDTO;
import com.candleshop.backend.dto.request.SignupRequest;
import com.candleshop.backend.model.Role;
import com.candleshop.backend.model.User;
import org.mapstruct.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public interface UserMapper {

    @Mapping(target = "roles", expression = "java(mapRoles(user.getRoles()))")
    @Mapping(target = "address", ignore = true)  // Ignore the address mapping for now
    UserDTO toDto(User user);

    List<UserDTO> toDtoList(List<User> users);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "addresses", ignore = true)
    @Mapping(target = "resetPasswordToken", ignore = true)
    @Mapping(target = "accountLocked", constant = "false")
    @Mapping(target = "accountEnabled", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    User signupToEntity(SignupRequest signupRequest);

    @Named("encodePassword")
    default String encodePassword(String password, @Context PasswordEncoder passwordEncoder) {
        return passwordEncoder.encode(password);
    }

    default Set<String> mapRoles(Set<Role> roles) {
        if (roles == null) {
            return Set.of();
        }
        return roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
    }
} 