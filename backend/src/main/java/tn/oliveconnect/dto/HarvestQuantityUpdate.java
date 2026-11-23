package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestQuantityUpdate {

  @NotBlank(message = "harvestId is required")
  private String harvestId;

  @PositiveOrZero(message = "quantityKg cannot be negative")
  private double quantityKg;

  private Instant actualHarvestDate;
}
