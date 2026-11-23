package tn.oliveconnect.mapper;

import org.springframework.stereotype.Component;
import tn.oliveconnect.dto.MeResponse;
import tn.oliveconnect.entity.User;

@Component
public class UserMapper {

  public MeResponse toMeResponse(User user) {
    return MeResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .phone(user.getPhone())
        .role(user.getRole())
        .active(user.isActive())
        .build();
  }
}
