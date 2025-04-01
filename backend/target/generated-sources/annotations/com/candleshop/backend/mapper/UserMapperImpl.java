package com.candleshop.backend.mapper;

import com.candleshop.backend.dto.UserDTO;
import com.candleshop.backend.dto.request.SignupRequest;
import com.candleshop.backend.model.User;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-04-01T14:36:11+0200",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.42.0.v20250325-2231, environment: Java 21.0.6 (Eclipse Adoptium)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserDTO toDto(User user) {
        if ( user == null ) {
            return null;
        }

        UserDTO userDTO = new UserDTO();

        userDTO.setAccountEnabled( user.isAccountEnabled() );
        userDTO.setCreatedAt( user.getCreatedAt() );
        userDTO.setEmail( user.getEmail() );
        userDTO.setFirstName( user.getFirstName() );
        userDTO.setId( user.getId() );
        userDTO.setLastName( user.getLastName() );
        userDTO.setPhoneNumber( user.getPhoneNumber() );
        userDTO.setUpdatedAt( user.getUpdatedAt() );

        userDTO.setRoles( mapRoles(user.getRoles()) );

        return userDTO;
    }

    @Override
    public List<UserDTO> toDtoList(List<User> users) {
        if ( users == null ) {
            return null;
        }

        List<UserDTO> list = new ArrayList<UserDTO>( users.size() );
        for ( User user : users ) {
            list.add( toDto( user ) );
        }

        return list;
    }

    @Override
    public User signupToEntity(SignupRequest signupRequest) {
        if ( signupRequest == null ) {
            return null;
        }

        User user = new User();

        user.setEmail( signupRequest.getEmail() );
        user.setFirstName( signupRequest.getFirstName() );
        user.setLastName( signupRequest.getLastName() );
        user.setPhoneNumber( signupRequest.getPhoneNumber() );

        user.setAccountLocked( false );
        user.setAccountEnabled( true );

        return user;
    }
}
