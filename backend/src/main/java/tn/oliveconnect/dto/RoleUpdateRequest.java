package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.Role;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleUpdateRequest {

  @NotNull(message = "role is required")
  private Role role;
}
