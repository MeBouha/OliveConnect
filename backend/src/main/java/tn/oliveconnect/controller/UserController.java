package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.dto.UserSummary;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.User;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users")
public class UserController {

  private final UserRepository userRepository;

  public UserController(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @GetMapping("/team-leaders")
  @PreAuthorize("hasAnyRole('COLLECTION_MANAGER','TEAM_LEADER','ADMIN')")
  @Operation(summary = "Active team leaders (id and name only) for tour planning")
  public List<UserSummary> teamLeaders() {
    return userRepository.findByRoleIn(List.of(Role.TEAM_LEADER)).stream()
        .filter(User::isActive)
        .sorted(Comparator.comparing(User::getFullName, Comparator.nullsLast(String::compareTo)))
        .map(UserSummary::of)
        .toList();
  }
}
