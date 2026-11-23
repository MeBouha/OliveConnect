package tn.oliveconnect.security;

import lombok.AllArgsConstructor;
import lombok.Getter;
import tn.oliveconnect.entity.Role;

@Getter
@AllArgsConstructor
public class AuthenticatedUser {

  private final String userId;
  private final String email;
  private final Role role;
}
