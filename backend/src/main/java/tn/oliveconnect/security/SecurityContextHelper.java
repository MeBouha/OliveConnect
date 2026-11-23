package tn.oliveconnect.security;

import tn.oliveconnect.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityContextHelper {

  private SecurityContextHelper() {
  }

  public static AuthenticatedUser currentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "No authenticated user");
    }
    return user;
  }

  public static String currentUserId() {
    return currentUser().getUserId();
  }

  public static boolean isAdmin() {
    return currentUser().getRole() == tn.oliveconnect.entity.Role.ADMIN;
  }

  public static boolean hasAnyRole(tn.oliveconnect.entity.Role... roles) {
    tn.oliveconnect.entity.Role current = currentUser().getRole();
    for (tn.oliveconnect.entity.Role role : roles) {
      if (current == role) {
        return true;
      }
    }
    return false;
  }
}
