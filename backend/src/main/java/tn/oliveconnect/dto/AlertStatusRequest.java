package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.AlertStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertStatusRequest {

  @NotNull(message = "status is required")
  private AlertStatus status;
}
