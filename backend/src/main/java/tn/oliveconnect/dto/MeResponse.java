package tn.oliveconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {

  private String id;
  private String email;
  private String fullName;
  private String phone;
  private Role role;
  private boolean active;
}
