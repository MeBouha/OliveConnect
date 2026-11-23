package tn.oliveconnect.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.Role;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

  @NotBlank(message = "email is required")
  @Email(message = "email must be valid")
  private String email;

  @NotBlank(message = "password is required")
  @Size(min = 8, message = "password must have at least 8 characters")
  private String password;

  @NotBlank(message = "fullName is required")
  private String fullName;

  private String phone;

  @NotNull(message = "role is required")
  @Builder.Default
  private Role role = Role.FARMER;
}
