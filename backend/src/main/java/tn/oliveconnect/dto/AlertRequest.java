package tn.oliveconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.AlertType;
import tn.oliveconnect.entity.GeoJsonPoint;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertRequest {

  @NotBlank(message = "orchardId is required")
  private String orchardId;

  @NotNull(message = "type is required")
  private AlertType type;

  @NotBlank(message = "description is required")
  private String description;

  @Valid
  @NotNull(message = "location is required")
  private GeoJsonPoint location;
}
