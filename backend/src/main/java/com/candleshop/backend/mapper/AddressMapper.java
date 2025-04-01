package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.AddressDTO;
import com.candleshop.backend.dto.request.AddressRequest;
import com.candleshop.backend.model.Address;
import com.candleshop.backend.model.User;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "userId", source = "user.id")
    AddressDTO toDto(Address address);

    List<AddressDTO> toDtoList(List<Address> addresses);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Address toEntity(AddressRequest addressRequest);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", expression = "java(getUser(address, user))")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Address toEntityWithUser(AddressRequest addressRequest, @Context User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateAddressFromRequest(AddressRequest addressRequest, @MappingTarget Address address);

    default User getUser(Address address, User user) {
        return user;
    }
} 