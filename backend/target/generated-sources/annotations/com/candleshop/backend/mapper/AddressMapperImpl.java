package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.AddressDTO;
import com.candleshop.backend.dto.request.AddressRequest;
import com.candleshop.backend.model.Address;
import com.candleshop.backend.model.User;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-04-01T14:00:35+0200",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.42.0.v20250325-2231, environment: Java 21.0.6 (Eclipse Adoptium)"
)
@Component
public class AddressMapperImpl implements AddressMapper {

    @Override
    public AddressDTO toDto(Address address) {
        if ( address == null ) {
            return null;
        }

        AddressDTO addressDTO = new AddressDTO();

        addressDTO.setUserId( addressUserId( address ) );
        addressDTO.setAddressType( address.getAddressType() );
        addressDTO.setCity( address.getCity() );
        addressDTO.setCountry( address.getCountry() );
        addressDTO.setCreatedAt( address.getCreatedAt() );
        addressDTO.setDefault( address.isDefault() );
        addressDTO.setId( address.getId() );
        addressDTO.setPostalCode( address.getPostalCode() );
        addressDTO.setState( address.getState() );
        addressDTO.setStreet( address.getStreet() );
        addressDTO.setUpdatedAt( address.getUpdatedAt() );

        return addressDTO;
    }

    @Override
    public List<AddressDTO> toDtoList(List<Address> addresses) {
        if ( addresses == null ) {
            return null;
        }

        List<AddressDTO> list = new ArrayList<AddressDTO>( addresses.size() );
        for ( Address address : addresses ) {
            list.add( toDto( address ) );
        }

        return list;
    }

    @Override
    public Address toEntity(AddressRequest addressRequest) {
        if ( addressRequest == null ) {
            return null;
        }

        Address address = new Address();

        address.setAddressType( addressRequest.getAddressType() );
        address.setCity( addressRequest.getCity() );
        address.setCountry( addressRequest.getCountry() );
        address.setDefault( addressRequest.isDefault() );
        address.setPostalCode( addressRequest.getPostalCode() );
        address.setState( addressRequest.getState() );
        address.setStreet( addressRequest.getStreet() );

        return address;
    }

    @Override
    public Address toEntityWithUser(AddressRequest addressRequest, User user) {
        if ( addressRequest == null ) {
            return null;
        }

        Address address = new Address();

        address.setAddressType( addressRequest.getAddressType() );
        address.setCity( addressRequest.getCity() );
        address.setCountry( addressRequest.getCountry() );
        address.setDefault( addressRequest.isDefault() );
        address.setPostalCode( addressRequest.getPostalCode() );
        address.setState( addressRequest.getState() );
        address.setStreet( addressRequest.getStreet() );

        address.setUser( getUser(address, user) );

        return address;
    }

    @Override
    public void updateAddressFromRequest(AddressRequest addressRequest, Address address) {
        if ( addressRequest == null ) {
            return;
        }

        address.setAddressType( addressRequest.getAddressType() );
        address.setCity( addressRequest.getCity() );
        address.setCountry( addressRequest.getCountry() );
        address.setDefault( addressRequest.isDefault() );
        address.setPostalCode( addressRequest.getPostalCode() );
        address.setState( addressRequest.getState() );
        address.setStreet( addressRequest.getStreet() );
    }

    private Long addressUserId(Address address) {
        if ( address == null ) {
            return null;
        }
        User user = address.getUser();
        if ( user == null ) {
            return null;
        }
        Long id = user.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
