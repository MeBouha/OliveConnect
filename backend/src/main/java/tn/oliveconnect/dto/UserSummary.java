package tn.oliveconnect.dto;

import tn.oliveconnect.entity.User;

/** Minimal public view of a user, safe to expose to non-admin roles. */
public record UserSummary(String id, String fullName) {

  public static UserSummary of(User user) {
    return new UserSummary(user.getId(), user.getFullName());
  }
}
