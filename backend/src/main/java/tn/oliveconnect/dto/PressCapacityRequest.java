package tn.oliveconnect.dto;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PressCapacityRequest {

  @PositiveOrZero(message = "capacityKgPerDay cannot be negative")
  private Double capacityKgPerDay;

  @PositiveOrZero(message = "currentLoadKg cannot be negative")
  private Double currentLoadKg;
}
